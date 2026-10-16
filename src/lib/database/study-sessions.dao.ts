import { getDatabase } from './connection';
import type { StudySession } from '../../types';

interface SessionRow {
  id: number;
  deck_id: number;
  cards_studied: number;
  cards_correct: number;
  duration_seconds: number;
  started_at: string;
  finished_at: string | null;
}

function rowToSession(row: SessionRow): StudySession {
  return {
    id: row.id,
    deckId: row.deck_id,
    cardsStudied: row.cards_studied,
    cardsCorrect: row.cards_correct,
    durationSeconds: row.duration_seconds,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  };
}

export async function createSession(deckId: number): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync('INSERT INTO study_sessions (deck_id) VALUES (?)', deckId);
  return result.lastInsertRowId;
}

export async function updateSession(
  id: number,
  cardsStudied: number,
  cardsCorrect: number,
  durationSeconds: number,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE study_sessions SET cards_studied = ?, cards_correct = ?, duration_seconds = ?, finished_at = datetime('now') WHERE id = ?",
    cardsStudied,
    cardsCorrect,
    durationSeconds,
    id,
  );
}

export async function getSessionsByDeck(
  deckId: number,
  limit: number = 30,
): Promise<StudySession[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SessionRow>(
    'SELECT * FROM study_sessions WHERE deck_id = ? ORDER BY started_at DESC LIMIT ?',
    deckId,
    limit,
  );
  return rows.map(rowToSession);
}

export async function getTodayStats(): Promise<{
  cardsStudied: number;
  cardsCorrect: number;
  totalTime: number;
}> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    cards_studied: number;
    cards_correct: number;
    total_time: number;
  }>(
    `SELECT
      COALESCE(SUM(cards_studied), 0) as cards_studied,
      COALESCE(SUM(cards_correct), 0) as cards_correct,
      COALESCE(SUM(duration_seconds), 0) as total_time
    FROM study_sessions
    WHERE date(started_at) = date('now')`,
  );
  return {
    cardsStudied: row?.cards_studied ?? 0,
    cardsCorrect: row?.cards_correct ?? 0,
    totalTime: row?.total_time ?? 0,
  };
}

export async function getStreak(): Promise<number> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ study_date: string }>(
    `SELECT DISTINCT date(started_at) as study_date
     FROM study_sessions
     WHERE cards_studied > 0
     ORDER BY study_date DESC
     LIMIT 365`,
  );

  if (rows.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < rows.length; i++) {
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    const dateStr = expectedDate.toISOString().split('T')[0];

    if (rows[i].study_date === dateStr) {
      streak++;
    } else if (i === 0 && streak === 0) {
      continue;
    } else {
      break;
    }
  }

  return streak;
}
