import { getDatabase } from './connection';
import type { Deck } from '../../types';

interface DeckRow {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  card_count: number;
  new_count: number;
  due_count: number;
}

function rowToDeck(row: DeckRow): Deck {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    cardCount: row.card_count,
    newCount: row.new_count,
    dueCount: row.due_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllDecks(): Promise<Deck[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DeckRow>(`
    SELECT
      d.id, d.name, d.description, d.created_at, d.updated_at,
      COUNT(c.id) as card_count,
      COUNT(CASE WHEN r.state = 'new' THEN 1 END) as new_count,
      COUNT(CASE WHEN r.due <= datetime('now') AND r.state != 'new' THEN 1 END) as due_count
    FROM decks d
    LEFT JOIN cards c ON c.deck_id = d.id
    LEFT JOIN reviews r ON r.card_id = c.id
    GROUP BY d.id
    ORDER BY d.updated_at DESC
  `);
  return rows.map(rowToDeck);
}

export async function getDeckById(id: number): Promise<Deck | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<DeckRow>(
    `
    SELECT
      d.id, d.name, d.description, d.created_at, d.updated_at,
      COUNT(c.id) as card_count,
      COUNT(CASE WHEN r.state = 'new' THEN 1 END) as new_count,
      COUNT(CASE WHEN r.due <= datetime('now') AND r.state != 'new' THEN 1 END) as due_count
    FROM decks d
    LEFT JOIN cards c ON c.deck_id = d.id
    LEFT JOIN reviews r ON r.card_id = c.id
    WHERE d.id = ?
    GROUP BY d.id
  `,
    id,
  );
  return row ? rowToDeck(row) : null;
}

export async function createDeck(name: string, description: string = ''): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO decks (name, description) VALUES (?, ?)',
    name,
    description,
  );
  return result.lastInsertRowId;
}

export async function updateDeck(id: number, name: string, description: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE decks SET name = ?, description = ?, updated_at = datetime('now') WHERE id = ?",
    name,
    description,
    id,
  );
}

export async function deleteDeck(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM decks WHERE id = ?', id);
}
