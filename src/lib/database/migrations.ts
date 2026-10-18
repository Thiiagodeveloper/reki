import * as SQLite from 'expo-sqlite';

const MIGRATION_V1 = [
  `CREATE TABLE IF NOT EXISTS decks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    type TEXT DEFAULT 'basic' CHECK (type IN ('basic', 'cloze', 'typing')),
    tags TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    state TEXT DEFAULT 'new' CHECK (state IN ('new', 'learning', 'review', 'relearning')),
    due TEXT DEFAULT (datetime('now')),
    stability REAL DEFAULT 0,
    difficulty REAL DEFAULT 0,
    elapsed_days REAL DEFAULT 0,
    scheduled_days REAL DEFAULT 0,
    reps INTEGER DEFAULT 0,
    lapses INTEGER DEFAULT 0,
    last_review TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS study_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    cards_studied INTEGER DEFAULT 0,
    cards_correct INTEGER DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    started_at TEXT DEFAULT (datetime('now')),
    finished_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    data BLOB,
    mime_type TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards(deck_id)`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_card_id ON reviews(card_id)`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_due ON reviews(due)`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_state ON reviews(state)`,
  `CREATE INDEX IF NOT EXISTS idx_study_sessions_deck_id ON study_sessions(deck_id)`,
];

interface Migration {
  version: number;
  statements: string[];
}

const migrations: Migration[] = [{ version: 1, statements: MIGRATION_V1 }];

export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.runAsync(`CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY)`);
  await db.runAsync(`PRAGMA journal_mode = WAL`);
  await db.runAsync(`PRAGMA foreign_keys = ON`);

  const tableCheck = await db.getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM sqlite_master WHERE type='table' AND name='decks'`,
  );
  if (tableCheck?.cnt === 0) {
    await db.runAsync('DELETE FROM schema_version');
  }

  const row = await db.getFirstAsync<{ version: number }>(
    'SELECT MAX(version) as version FROM schema_version',
  );
  const currentVersion = row?.version ?? 0;

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      for (const stmt of migration.statements) {
        await db.runAsync(stmt);
      }
      await db.runAsync('INSERT INTO schema_version (version) VALUES (?)', migration.version);
    }
  }
}
