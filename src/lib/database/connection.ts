import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';

const DB_NAME = 'reki_v2.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = initDatabase();
  }
  return dbPromise;
}

async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  let db = await SQLite.openDatabaseAsync(DB_NAME);
  try {
    await runMigrations(db);
  } catch (e) {
    console.error('Migration failed, resetting database:', e);
    await db.closeAsync();
    await SQLite.deleteDatabaseAsync(DB_NAME);
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await runMigrations(db);
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    await db.closeAsync();
    dbPromise = null;
  }
}
