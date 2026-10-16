import { create } from 'zustand';
import { reviewsDao, studySessionsDao } from '../lib/database';
import { gradeCard, previewGrades } from '../lib/fsrs';
import type { Grade } from 'ts-fsrs';
import type { DueCard } from '../lib/database/reviews.dao';

interface StudyState {
  deckId: number | null;
  queue: DueCard[];
  currentIndex: number;
  sessionId: number | null;
  cardsStudied: number;
  cardsCorrect: number;
  startTime: number | null;
  isFlipped: boolean;
  loading: boolean;
  intervalPreview: Record<number, { due: Date; interval: number }> | null;

  startSession: (deckId: number) => Promise<void>;
  flipCard: () => void;
  answerCard: (grade: Grade) => Promise<void>;
  endSession: () => Promise<void>;

  currentCard: () => DueCard | null;
  remainingCount: () => number;
  isComplete: () => boolean;
}

export const useStudyStore = create<StudyState>((set, get) => ({
  deckId: null,
  queue: [],
  currentIndex: 0,
  sessionId: null,
  cardsStudied: 0,
  cardsCorrect: 0,
  startTime: null,
  isFlipped: false,
  loading: false,
  intervalPreview: null,

  startSession: async (deckId) => {
    set({ loading: true });
    const dueCards = await reviewsDao.getDueCards(deckId);
    const sessionId = await studySessionsDao.createSession(deckId);

    let preview = null;
    if (dueCards.length > 0) {
      preview = previewGrades(dueCards[0].review);
    }

    set({
      deckId,
      queue: dueCards,
      currentIndex: 0,
      sessionId,
      cardsStudied: 0,
      cardsCorrect: 0,
      startTime: Date.now(),
      isFlipped: false,
      loading: false,
      intervalPreview: preview,
    });
  },

  flipCard: () => {
    set({ isFlipped: true });
  },

  answerCard: async (grade) => {
    const { queue, currentIndex, cardsStudied, cardsCorrect } = get();
    const current = queue[currentIndex];
    if (!current) return;

    await gradeCard(current.card.id, grade);

    const newStudied = cardsStudied + 1;
    const newCorrect = grade >= 3 ? cardsCorrect + 1 : cardsCorrect;
    const nextIndex = currentIndex + 1;

    let preview = null;
    if (nextIndex < queue.length) {
      preview = previewGrades(queue[nextIndex].review);
    }

    set({
      currentIndex: nextIndex,
      cardsStudied: newStudied,
      cardsCorrect: newCorrect,
      isFlipped: false,
      intervalPreview: preview,
    });

    if (nextIndex >= queue.length) {
      await get().endSession();
    }
  },

  endSession: async () => {
    const { sessionId, cardsStudied, cardsCorrect, startTime } = get();
    if (!sessionId || !startTime) return;

    const duration = Math.round((Date.now() - startTime) / 1000);
    await studySessionsDao.updateSession(sessionId, cardsStudied, cardsCorrect, duration);
  },

  currentCard: () => {
    const { queue, currentIndex } = get();
    return queue[currentIndex] ?? null;
  },

  remainingCount: () => {
    const { queue, currentIndex } = get();
    return queue.length - currentIndex;
  },

  isComplete: () => {
    const { queue, currentIndex } = get();
    return queue.length > 0 && currentIndex >= queue.length;
  },
}));
