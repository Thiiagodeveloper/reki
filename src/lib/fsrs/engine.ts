import { fsrs, createEmptyCard, Rating, State, type Card as FSRSCard, type Grade } from 'ts-fsrs';
import { reviewsDao } from '../database';
import type { ReviewState } from '../../types';

const scheduler = fsrs({
  request_retention: 0.9,
  maximum_interval: 365,
  enable_fuzz: true,
  enable_short_term: true,
});

export { Rating };

export function createNewFSRSCard(): FSRSCard {
  return createEmptyCard(new Date());
}

function reviewStateToFSRSCard(review: ReviewState): FSRSCard {
  const stateMap: Record<string, State> = {
    new: State.New,
    learning: State.Learning,
    review: State.Review,
    relearning: State.Relearning,
  };

  return {
    due: new Date(review.due),
    stability: review.stability,
    difficulty: review.difficulty,
    elapsed_days: review.elapsedDays,
    scheduled_days: review.scheduledDays,
    reps: review.reps,
    lapses: review.lapses,
    state: stateMap[review.state] ?? State.New,
    last_review: review.lastReview ? new Date(review.lastReview) : undefined,
    learning_steps: 0,
  };
}

function stateToString(state: State): string {
  const map: Record<State, string> = {
    [State.New]: 'new',
    [State.Learning]: 'learning',
    [State.Review]: 'review',
    [State.Relearning]: 'relearning',
  };
  return map[state];
}

export interface SchedulingResult {
  cardId: number;
  grade: Grade;
  nextDue: Date;
  nextState: string;
  interval: number;
}

export async function gradeCard(cardId: number, grade: Grade): Promise<SchedulingResult> {
  const review = await reviewsDao.getReviewByCardId(cardId);
  if (!review) throw new Error(`No review found for card ${cardId}`);

  const fsrsCard = reviewStateToFSRSCard(review);
  const now = new Date();

  const result = scheduler.next(fsrsCard, now, grade);
  const nextCard = result.card;

  await reviewsDao.updateReview(
    cardId,
    stateToString(nextCard.state),
    nextCard.due.toISOString(),
    nextCard.stability,
    nextCard.difficulty,
    nextCard.elapsed_days,
    nextCard.scheduled_days,
    nextCard.reps,
    nextCard.lapses,
    now.toISOString(),
  );

  return {
    cardId,
    grade,
    nextDue: nextCard.due,
    nextState: stateToString(nextCard.state),
    interval: nextCard.scheduled_days,
  };
}

export function previewGrades(review: ReviewState) {
  const fsrsCard = reviewStateToFSRSCard(review);
  const now = new Date();
  const preview = scheduler.repeat(fsrsCard, now);

  return {
    [Rating.Again]: {
      due: preview[Rating.Again].card.due,
      interval: preview[Rating.Again].card.scheduled_days,
    },
    [Rating.Hard]: {
      due: preview[Rating.Hard].card.due,
      interval: preview[Rating.Hard].card.scheduled_days,
    },
    [Rating.Good]: {
      due: preview[Rating.Good].card.due,
      interval: preview[Rating.Good].card.scheduled_days,
    },
    [Rating.Easy]: {
      due: preview[Rating.Easy].card.due,
      interval: preview[Rating.Easy].card.scheduled_days,
    },
  };
}

export function formatInterval(days: number): string {
  if (days < 1) {
    const minutes = Math.round(days * 24 * 60);
    if (minutes < 60) return `${minutes}m`;
    return `${Math.round(minutes / 60)}h`;
  }
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}
