import JSZip from 'jszip';
import { File, Paths, Directory } from 'expo-file-system';
import { getDatabase } from '../database/connection';
import { cardsDao } from '../database';

export async function exportDeckAsApkg(deckId: number, deckName: string): Promise<string> {
  const db = await getDatabase();
  const cards = await cardsDao.getCardsByDeck(deckId);

  if (cards.length === 0) throw new Error('Deck has no cards to export');

  const modelId = Date.now();
  const deckIdAnki = modelId + 1;

  const models: Record<string, object> = {
    [String(modelId)]: {
      id: modelId,
      name: 'Basic',
      type: 0,
      flds: [
        { name: 'Front', ord: 0, sticky: false, rtl: false, font: 'Arial', size: 20, media: [] },
        { name: 'Back', ord: 1, sticky: false, rtl: false, font: 'Arial', size: 20, media: [] },
      ],
      tmpls: [
        {
          name: 'Card 1',
          ord: 0,
          qfmt: '{{Front}}',
          afmt: '{{FrontSide}}<hr id=answer>{{Back}}',
          bqfmt: '',
          bafmt: '',
        },
      ],
      css: '.card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; }',
      sortf: 0,
      did: deckIdAnki,
      mod: Math.floor(Date.now() / 1000),
      usn: -1,
      vers: [],
      tags: [],
      req: [[0, 'all', [0]]],
    },
  };

  const decks: Record<string, object> = {
    '1': { id: 1, name: 'Default', mod: 0, usn: 0, collapsed: true, desc: '', conf: 1 },
    [String(deckIdAnki)]: {
      id: deckIdAnki,
      name: deckName,
      mod: Math.floor(Date.now() / 1000),
      usn: -1,
      collapsed: false,
      desc: '',
      conf: 1,
    },
  };

  const conf = {
    activeDecks: [1],
    curDeck: deckIdAnki,
    newSpread: 0,
    collapseTime: 1200,
    timeLim: 0,
    estTimes: true,
    dueCounts: true,
    curModel: String(modelId),
    nextPos: cards.length + 1,
    sortType: 'noteFld',
    sortBackwards: false,
  };

  const exportDir = new Directory(Paths.cache, `apkg_export_${Date.now()}`);
  exportDir.create();

  const dbPath = new File(exportDir, 'collection.anki2');

  const SQLite = await import('expo-sqlite');
  const exportDb = await SQLite.openDatabaseAsync(
    `../../../${dbPath.uri.replace(Paths.document.uri, '')}`,
  );

  await exportDb.execAsync(`
    CREATE TABLE col (id integer primary key, crt integer, mod integer, scm integer, ver integer, dty integer, usn integer, ls integer, conf text, models text, decks text, dconf text, tags text);
    CREATE TABLE notes (id integer primary key, guid text, mid integer, mod integer, usn integer, tags text, flds text, sfld text, csum integer, flags integer, data text);
    CREATE TABLE cards (id integer primary key, nid integer, did integer, ord integer, mod integer, usn integer, type integer, queue integer, due integer, ivl integer, factor integer, reps integer, lapses integer, left integer, odue integer, odid integer, flags integer, data text);
    CREATE TABLE revlog (id integer primary key, cid integer, usn integer, ease integer, ivl integer, lastIvl integer, factor integer, time integer, type integer);
    CREATE TABLE graves (usn integer, oid integer, type integer);
  `);

  const now = Math.floor(Date.now() / 1000);
  await exportDb.runAsync(
    'INSERT INTO col VALUES (1, ?, ?, ?, 11, 0, 0, 0, ?, ?, ?, ?, ?)',
    now,
    now,
    now * 1000,
    JSON.stringify(conf),
    JSON.stringify(models),
    JSON.stringify(decks),
    '{}',
    '{}',
  );

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const noteId = now * 1000 + i;
    const cardId = noteId + 1;
    const guid = Math.random().toString(36).substring(2, 12);
    const flds = `${card.front}\x1f${card.back}`;
    const csum = simpleChecksum(card.front);

    await exportDb.runAsync(
      'INSERT INTO notes VALUES (?, ?, ?, ?, -1, ?, ?, ?, ?, 0, ?)',
      noteId,
      guid,
      modelId,
      now,
      card.tags || '',
      flds,
      card.front,
      csum,
      '',
    );

    await exportDb.runAsync(
      'INSERT INTO cards VALUES (?, ?, ?, 0, ?, -1, 0, 0, ?, 0, 0, 0, 0, 0, 0, 0, 0, ?)',
      cardId,
      noteId,
      deckIdAnki,
      now,
      i,
      '',
    );
  }

  await exportDb.closeAsync();

  const zip = new JSZip();
  const dbFile = new File(exportDir, 'collection.anki2');
  const dbBytes = await dbFile.bytes();
  zip.file('collection.anki2', dbBytes);
  zip.file('media', '{}');

  const zipBytes = await zip.generateAsync({ type: 'uint8array' });

  const outFileName = `${deckName.replace(/[^a-zA-Z0-9]/g, '_')}.apkg`;
  const outFile = new File(Paths.cache, outFileName);
  await outFile.write(zipBytes);

  try {
    exportDir.delete();
  } catch {
    /* cleanup */
  }

  return outFile.uri;
}

function simpleChecksum(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
