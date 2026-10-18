import { getDatabase } from './connection';
import type { Card } from '../../types';

interface CardRow {
  id: number;
  deck_id: number;
  front: string;
  back: string;
  type: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

function rowToCard(row: CardRow): Card {
  return {
    id: row.id,
    deckId: row.deck_id,
    front: row.front,
    back: row.back,
    type: row.type as Card['type'],
    tags: row.tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getCardsByDeck(deckId: number): Promise<Card[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CardRow>(
    'SELECT * FROM cards WHERE deck_id = ? ORDER BY created_at DESC',
    deckId,
  );
  return rows.map(rowToCard);
}

export async function getCardById(id: number): Promise<Card | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<CardRow>('SELECT * FROM cards WHERE id = ?', id);
  return row ? rowToCard(row) : null;
}

export async function createCard(
  deckId: number,
  front: string,
  back: string,
  type: string = 'basic',
  tags: string = '',
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'INSERT INTO cards (deck_id, front, back, type, tags) VALUES (?, ?, ?, ?, ?)',
    deckId,
    front,
    back,
    type,
    tags,
  );

  await db.runAsync(
    'INSERT INTO reviews (card_id, state, due) VALUES (?, ?, datetime(?))',
    result.lastInsertRowId,
    'new',
    'now',
  );

  return result.lastInsertRowId;
}

export async function updateCard(
  id: number,
  front: string,
  back: string,
  tags: string = '',
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE cards SET front = ?, back = ?, tags = ?, updated_at = datetime('now') WHERE id = ?",
    front,
    back,
    tags,
    id,
  );
}

export async function deleteCard(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM cards WHERE id = ?', id);
}

export async function getCardCount(deckId: number): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM cards WHERE deck_id = ?',
    deckId,
  );
  return row?.count ?? 0;
}

export async function searchCards(
  query: string,
  deckId?: number,
): Promise<(Card & { deckName: string })[]> {
  const db = await getDatabase();
  const searchTerm = `%${query}%`;

  let sql = `
    SELECT c.*, d.name as deck_name
    FROM cards c
    JOIN decks d ON d.id = c.deck_id
    WHERE (c.front LIKE ? OR c.back LIKE ? OR c.tags LIKE ?)
  `;
  const params: (string | number)[] = [searchTerm, searchTerm, searchTerm];

  if (deckId) {
    sql += ' AND c.deck_id = ?';
    params.push(deckId);
  }

  sql += ' ORDER BY c.updated_at DESC LIMIT 100';

  const rows = await db.getAllAsync<CardRow & { deck_name: string }>(sql, ...params);
  return rows.map((row) => ({
    ...rowToCard(row),
    deckName: row.deck_name,
  }));
}
