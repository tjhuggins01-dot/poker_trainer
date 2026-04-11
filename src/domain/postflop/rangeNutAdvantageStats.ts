import type { AppData, SessionStats } from '../../lib/types';
import type { RangeNutQuizEntry, RangeNutQuizEvaluation } from './rangeNutAdvantageQuiz';

export const buildRangeNutMissKey = (entry: RangeNutQuizEntry): string => `${entry.spot}|${entry.board.join(' ')}`;

export const reduceSessionOnRangeNutAnswer = (
  prev: SessionStats,
  evaluation: RangeNutQuizEvaluation,
  responseMs: number,
): SessionStats => ({
  ...prev,
  attempts: prev.attempts + 1,
  correct: prev.correct + (evaluation.fullyCorrect ? 1 : 0),
  totalResponseMs: prev.totalResponseMs + responseMs,
  byDrill: {
    ...prev.byDrill,
    postflop_range_nut_advantage: {
      attempts: prev.byDrill.postflop_range_nut_advantage.attempts + 1,
      correct: prev.byDrill.postflop_range_nut_advantage.correct + (evaluation.fullyCorrect ? 1 : 0),
    },
  },
  byDrillResponseMs: {
    ...prev.byDrillResponseMs,
    postflop_range_nut_advantage: prev.byDrillResponseMs.postflop_range_nut_advantage + responseMs,
  },
  postflop: {
    ...prev.postflop,
    rangeNutAdvantage: {
      ...prev.postflop.rangeNutAdvantage,
      attempts: prev.postflop.rangeNutAdvantage.attempts + 1,
      fullyCorrect: prev.postflop.rangeNutAdvantage.fullyCorrect + (evaluation.fullyCorrect ? 1 : 0),
      rangeCorrect: prev.postflop.rangeNutAdvantage.rangeCorrect + (evaluation.rangeCorrect ? 1 : 0),
      nutCorrect: prev.postflop.rangeNutAdvantage.nutCorrect + (evaluation.nutCorrect ? 1 : 0),
      totalResponseMs: prev.postflop.rangeNutAdvantage.totalResponseMs + responseMs,
    },
  },
});

export const reduceDataOnRangeNutAnswer = (
  prev: AppData,
  entry: RangeNutQuizEntry,
  evaluation: RangeNutQuizEvaluation,
  responseMs: number,
): AppData => {
  const missKey = buildRangeNutMissKey(entry);
  const missedBoards = evaluation.fullyCorrect
    ? prev.stats.postflop.rangeNutAdvantage.missedBoards
    : {
        ...prev.stats.postflop.rangeNutAdvantage.missedBoards,
        [missKey]: (prev.stats.postflop.rangeNutAdvantage.missedBoards[missKey] ?? 0) + 1,
      };

  return {
    ...prev,
    stats: {
      ...prev.stats,
      total: {
        attempts: prev.stats.total.attempts + 1,
        correct: prev.stats.total.correct + (evaluation.fullyCorrect ? 1 : 0),
      },
      byDrill: {
        ...prev.stats.byDrill,
        postflop_range_nut_advantage: {
          attempts: prev.stats.byDrill.postflop_range_nut_advantage.attempts + 1,
          correct: prev.stats.byDrill.postflop_range_nut_advantage.correct + (evaluation.fullyCorrect ? 1 : 0),
        },
      },
      byDrillResponseMs: {
        ...prev.stats.byDrillResponseMs,
        postflop_range_nut_advantage: prev.stats.byDrillResponseMs.postflop_range_nut_advantage + responseMs,
      },
      postflop: {
        ...prev.stats.postflop,
        rangeNutAdvantage: {
          ...prev.stats.postflop.rangeNutAdvantage,
          attempts: prev.stats.postflop.rangeNutAdvantage.attempts + 1,
          fullyCorrect: prev.stats.postflop.rangeNutAdvantage.fullyCorrect + (evaluation.fullyCorrect ? 1 : 0),
          rangeCorrect: prev.stats.postflop.rangeNutAdvantage.rangeCorrect + (evaluation.rangeCorrect ? 1 : 0),
          nutCorrect: prev.stats.postflop.rangeNutAdvantage.nutCorrect + (evaluation.nutCorrect ? 1 : 0),
          totalResponseMs: prev.stats.postflop.rangeNutAdvantage.totalResponseMs + responseMs,
          missedBoards,
        },
      },
    },
  };
};
