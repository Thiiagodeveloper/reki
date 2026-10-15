export interface Deck {
  id: number;
  name: string;
  description: string;
  cardCount: number;
  newCount: number;
  dueCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  id: number;
  deckId: number;
  front: string;
  back: string;
  type: CardType;
  tags: string;
  createdAt: string;
  updatedAt: string;
}

export type CardType = 'basic' | 'cloze' | 'typing';

export interface ReviewState {
  id: number;
  cardId: number;
  state: FSRSState;
  due: string;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  lastReview: string | null;
  createdAt: string;
}

export type FSRSState = 'new' | 'learning' | 'review' | 'relearning';

export interface StudySession {
  id: number;
  deckId: number;
  cardsStudied: number;
  cardsCorrect: number;
  durationSeconds: number;
  startedAt: string;
  finishedAt: string | null;
}
