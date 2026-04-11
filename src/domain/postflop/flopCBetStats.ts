import type { AppData, SessionStats } from '../../lib/types';
import type { FlopCBetEntry, FlopCBetEvaluation } from './flopCBetTrainer';

export const buildFlopCBetMissKey = (entry: FlopCBetEntry): string => `${entry.spot}|${entry.board.join(' ')}`;

export const reduceSessionOnFlopCBetAnswer = (
  prev: SessionStats,
  evaluation: FlopCBetEvaluation,
  responseMs: number,
): SessionStats => ({
  ...prev,
  attempts: prev.attempts + 1,
  correct: prev.correct + (evaluation.correct ? 1 : 0),
  totalResponseMs: prev.totalResponseMs + responseMs,
  byDrill: {
    ...prev.byDrill,
    postflop_flop_cbet: {
      attempts: prev.byDrill.postflop_flop_cbet.attempts + 1,
      correct: prev.byDrill.postflop_flop_cbet.correct + (evaluation.correct ? 1 : 0),
    },
  },
  byDrillResponseMs: {
    ...prev.byDrillResponseMs,
    postflop_flop_cbet: prev.byDrillResponseMs.postflop_flop_cbet + responseMs,
  },
  postflop: {
    ...prev.postflop,
    flopCBet: {
      attempts: prev.postflop.flopCBet.attempts + 1,
      correct: prev.postflop.flopCBet.correct + (evaluation.correct ? 1 : 0),
      totalResponseMs: prev.postflop.flopCBet.totalResponseMs + responseMs,
    },
  },
});

export const reduceDataOnFlopCBetAnswer = (
  prev: AppData,
  entry: FlopCBetEntry,
  evaluation: FlopCBetEvaluation,
  responseMs: number,
): AppData => {
  const missKey = buildFlopCBetMissKey(entry);
  const missedBoards = evaluation.correct
    ? prev.stats.postflop.flopCBet.missedBoards
    : {
        ...prev.stats.postflop.flopCBet.missedBoards,
        [missKey]: (prev.stats.postflop.flopCBet.missedBoards[missKey] ?? 0) + 1,
      };

  return {
    ...prev,
    stats: {
      ...prev.stats,
      total: {
        attempts: prev.stats.total.attempts + 1,
        correct: prev.stats.total.correct + (evaluation.correct ? 1 : 0),
      },
      byDrill: {
        ...prev.stats.byDrill,
        postflop_flop_cbet: {
          attempts: prev.stats.byDrill.postflop_flop_cbet.attempts + 1,
          correct: prev.stats.byDrill.postflop_flop_cbet.correct + (evaluation.correct ? 1 : 0),
        },
      },
      byDrillResponseMs: {
        ...prev.stats.byDrillResponseMs,
        postflop_flop_cbet: prev.stats.byDrillResponseMs.postflop_flop_cbet + responseMs,
      },
      postflop: {
        ...prev.stats.postflop,
        flopCBet: {
          attempts: prev.stats.postflop.flopCBet.attempts + 1,
          correct: prev.stats.postflop.flopCBet.correct + (evaluation.correct ? 1 : 0),
          totalResponseMs: prev.stats.postflop.flopCBet.totalResponseMs + responseMs,
          missedBoards,
        },
      },
    },
  };
};
