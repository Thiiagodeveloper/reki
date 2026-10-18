import JSZip from 'jszip';
import { File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { getDatabase } from '../database/connection';

export interface ImportResult {
  deckName: string;
  cardsImported: number;
  mediaImported: number;
  errors: string[];
}

interface AnkiModel {
  name: string;
  flds: { name: string; ord: number }[];
}

const TEMP_DB_NAME = '_apkg_import_temp.db';

const FRONT_KEYWORDS = ['palabra', 'word', 'front', 'anverso', 'question', 'term', 'verbo'];
const BACK_KEYWORDS = [
  'definic',
  'definition',
  'back',
  'answer',
  'meaning',
  'traduccion',
  'translation',
  'ejemplo',
  'example',
  'frase',
];
const SKIP_KEYWORDS = [
  'indice',
  'index',
  'ordenacion',
  'sort',
  'nombredelarchivo',
  'audio',
  'sound',
  'imagen',
  'image',
  'img',
  'foto',
  'photo',
  'video',
];

export async function importApkg(fileUri: string): Promise<ImportResult> {
  const errors: string[] = [];

  const sourceFile = new File(fileUri);
  const fileBase64 = await sourceFile.base64();

  const zip = await JSZip.loadAsync(fileBase64, { base64: true });

  const dbFile = zip.file('collection.anki21') || zip.file('collection.anki2');
  if (!dbFile) {
    throw new Error('Invalid .apkg file: no collection database found');
  }

  const dbBuffer = await dbFile.async('uint8array');

  const sqliteDir = new File(Paths.document, 'SQLite');
  const dirInfo = Paths.info(sqliteDir.uri);
  if (!dirInfo.exists) {
    const { Directory } = await import('expo-file-system');
    const dir = new Directory(Paths.document, 'SQLite');
    dir.create();
  }

  const tempDbFile = new File(Paths.document, 'SQLite', TEMP_DB_NAME);
  await tempDbFile.write(dbBuffer);

  const ankiDb = await SQLite.openDatabaseAsync(TEMP_DB_NAME);

  let deckName = 'Imported Deck';
  const models: Record<string, AnkiModel> = {};

  try {
    const colRow = await ankiDb.getFirstAsync<{ models: string; decks: string }>(
      'SELECT models, decks FROM col',
    );
    if (colRow) {
      const decksJson = JSON.parse(colRow.decks);
      const deckIds = Object.keys(decksJson).filter((id) => id !== '1');
      if (deckIds.length > 0) {
        deckName = decksJson[deckIds[0]].name;
      } else if (decksJson['1']) {
        deckName = decksJson['1'].name;
      }

      const modelsJson = JSON.parse(colRow.models);
      for (const [id, model] of Object.entries(modelsJson)) {
        const m = model as AnkiModel;
        models[id] = { name: m.name, flds: m.flds };
      }
    }
  } catch {
    errors.push('Could not parse collection metadata, using defaults');
  }

  interface NoteRow {
    id: number;
    mid: number;
    flds: string;
    tags: string;
  }

  const notes: { id: number; mid: number; fields: string[]; tags: string }[] = [];
  try {
    const noteRows = await ankiDb.getAllAsync<NoteRow>('SELECT id, mid, flds, tags FROM notes');
    for (const row of noteRows) {
      notes.push({
        id: row.id,
        mid: row.mid,
        fields: row.flds.split('\x1f'),
        tags: row.tags.trim(),
      });
    }
  } catch {
    errors.push('Could not read notes table');
  }

  await ankiDb.closeAsync();

  const db = await getDatabase();
  const deckId = (
    await db.runAsync(
      'INSERT INTO decks (name, description) VALUES (?, ?)',
      deckName,
      `Imported from .apkg (${notes.length} notes)`,
    )
  ).lastInsertRowId;

  let cardsImported = 0;

  for (const note of notes) {
    const model = models[String(note.mid)];
    const { front, back } = extractFrontBack(note.fields, model);

    if (!front.trim()) continue;

    try {
      const cardResult = await db.runAsync(
        'INSERT INTO cards (deck_id, front, back, type, tags) VALUES (?, ?, ?, ?, ?)',
        deckId,
        front,
        back,
        'basic',
        note.tags,
      );

      await db.runAsync(
        "INSERT INTO reviews (card_id, state, due) VALUES (?, 'new', datetime('now'))",
        cardResult.lastInsertRowId,
      );

      cardsImported++;
    } catch {
      errors.push(`Failed to import note ${note.id}`);
    }
  }

  let mediaImported = 0;
  const mediaFile = zip.file('media');
  if (mediaFile) {
    try {
      const mediaJson = JSON.parse(await mediaFile.async('string'));
      mediaImported = Object.keys(mediaJson).length;
    } catch {
      errors.push('Could not process media files');
    }
  }

  try {
    tempDbFile.delete();
  } catch {
    // cleanup is best effort
  }

  return {
    deckName,
    cardsImported,
    mediaImported,
    errors,
  };
}

function extractFrontBack(fields: string[], model?: AnkiModel): { front: string; back: string } {
  if (!model || !model.flds || model.flds.length === 0) {
    return {
      front: stripHtml(fields[0] || ''),
      back: stripHtml(fields.slice(1).join('\n')),
    };
  }

  const fieldNames = model.flds.map((f) =>
    f.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''),
  );

  let frontIdx = -1;
  let backIndices: number[] = [];

  for (let i = 0; i < fieldNames.length; i++) {
    const name = fieldNames[i];
    if (SKIP_KEYWORDS.some((kw) => name.includes(kw))) continue;

    if (frontIdx === -1 && FRONT_KEYWORDS.some((kw) => name.includes(kw))) {
      frontIdx = i;
    } else if (BACK_KEYWORDS.some((kw) => name.includes(kw))) {
      backIndices.push(i);
    }
  }

  if (frontIdx === -1) {
    for (let i = 0; i < fieldNames.length; i++) {
      if (!SKIP_KEYWORDS.some((kw) => fieldNames[i].includes(kw))) {
        frontIdx = i;
        break;
      }
    }
  }

  if (backIndices.length === 0) {
    for (let i = 0; i < fieldNames.length; i++) {
      if (i !== frontIdx && !SKIP_KEYWORDS.some((kw) => fieldNames[i].includes(kw))) {
        const val = stripHtml(fields[i] || '');
        if (val && !val.match(/^\[sound:|<img/)) {
          backIndices.push(i);
        }
      }
    }
  }

  const front = stripHtml(fields[frontIdx] || fields[0] || '');
  const backParts = backIndices.map((i) => stripHtml(fields[i] || '')).filter((v) => v.length > 0);
  const back = backParts.length > 0 ? backParts.join('\n') : stripHtml(fields[1] || '');

  return { front, back };
}

function stripHtml(html: string): string {
  return html
    .replace(/\[sound:[^\]]*\]/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<div>/gi, '\n')
    .replace(/<\/div>/gi, '')
    .replace(/<img[^>]*>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
