import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';

const DB_NAME = 'reki.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  await runMigrations(dbInstance);
  return dbInstance;
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
}
