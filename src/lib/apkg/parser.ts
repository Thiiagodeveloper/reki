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

const TEMP_DB_NAME = '_apkg_import_temp.db';

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
    const dir = new (await import('expo-file-system')).Directory(Paths.document, 'SQLite');
    dir.create();
  }

  const tempDbFile = new File(Paths.document, 'SQLite', TEMP_DB_NAME);
  await tempDbFile.write(dbBuffer);

  const ankiDb = await SQLite.openDatabaseAsync(TEMP_DB_NAME);

  let deckName = 'Imported Deck';

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

  const notes: { id: number; fields: string[]; tags: string }[] = [];
  try {
    const noteRows = await ankiDb.getAllAsync<NoteRow>('SELECT id, mid, flds, tags FROM notes');
    for (const row of noteRows) {
      notes.push({
        id: row.id,
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
      'Imported from .apkg',
    )
  ).lastInsertRowId;

  let cardsImported = 0;

  await db.withTransactionAsync(async () => {
    for (const note of notes) {
      const front = note.fields[0] || '';
      const back = note.fields.slice(1).join('\n') || '';

      if (!front.trim()) continue;

      try {
        const cardResult = await db.runAsync(
          'INSERT INTO cards (deck_id, front, back, type, tags) VALUES (?, ?, ?, ?, ?)',
          deckId,
          stripHtml(front),
          stripHtml(back),
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
  });

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

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<div>/gi, '\n')
    .replace(/<\/div>/gi, '')
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
