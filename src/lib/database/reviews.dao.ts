import { getDatabase } from './connection';
import type { ReviewState, Card } from '../../types';

interface ReviewRow {
  id: number;
  card_id: number;
  state: string;
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  last_review: string | null;
  created_at: string;
}

function rowToReview(row: ReviewRow): ReviewState {
  return {
    id: row.id,
    cardId: row.card_id,
    state: row.state as ReviewState['state'],
    due: row.due,
    stability: row.stability,
    difficulty: row.difficulty,
    elapsedDays: row.elapsed_days,
    scheduledDays: row.scheduled_days,
    reps: row.reps,
    lapses: row.lapses,
    lastReview: row.last_review,
    createdAt: row.created_at,
  };
}

export async function getReviewByCardId(cardId: number): Promise<ReviewState | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ReviewRow>(
    'SELECT * FROM reviews WHERE card_id = ? ORDER BY id DESC LIMIT 1',
    cardId,
  );
  return row ? rowToReview(row) : null;
}

export interface DueCard {
  card: Card;
  review: ReviewState;
}

export async function getDueCards(deckId: number, limit: number = 50): Promise<DueCard[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<
    ReviewRow & {
      front: string;
      back: string;
      type: string;
      tags: string;
      deck_id: number;
      card_created_at: string;
      card_updated_at: string;
    }
  >(
    `
    SELECT
      r.*,
      c.front, c.back, c.type, c.tags, c.deck_id,
      c.created_at as card_created_at, c.updated_at as card_updated_at
    FROM reviews r
    JOIN cards c ON c.id = r.card_id
    WHERE c.deck_id = ?
      AND (r.state = 'new' OR r.due <= datetime('now'))
    ORDER BY
      CASE r.state
        WHEN 'relearning' THEN 0
        WHEN 'learning' THEN 1
        WHEN 'new' THEN 2
        WHEN 'review' THEN 3
      END,
      r.due ASC
    LIMIT ?
  `,
    deckId,
    limit,
  );

  return rows.map((row) => ({
    card: {
      id: row.card_id,
      deckId: row.deck_id,
      front: row.front,
      back: row.back,
      type: row.type as Card['type'],
      tags: row.tags,
      createdAt: row.card_created_at,
      updatedAt: row.card_updated_at,
    },
    review: rowToReview(row),
  }));
}

export async function updateReview(
  cardId: number,
  state: string,
  due: string,
  stability: number,
  difficulty: number,
  elapsedDays: number,
  scheduledDays: number,
  reps: number,
  lapses: number,
  lastReview: string,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE reviews SET
      state = ?, due = ?, stability = ?, difficulty = ?,
      elapsed_days = ?, scheduled_days = ?, reps = ?, lapses = ?,
      last_review = ?
    WHERE card_id = ?`,
    state,
    due,
    stability,
    difficulty,
    elapsedDays,
    scheduledDays,
    reps,
    lapses,
    lastReview,
    cardId,
  );
}

export async function getDueCountForDeck(
  deckId: number,
): Promise<{ newCount: number; dueCount: number }> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ new_count: number; due_count: number }>(
    `
    SELECT
      COUNT(CASE WHEN r.state = 'new' THEN 1 END) as new_count,
      COUNT(CASE WHEN r.due <= datetime('now') AND r.state != 'new' THEN 1 END) as due_count
    FROM reviews r
    JOIN cards c ON c.id = r.card_id
    WHERE c.deck_id = ?
  `,
    deckId,
  );
  return {
    newCount: row?.new_count ?? 0,
    dueCount: row?.due_count ?? 0,
  };
}
