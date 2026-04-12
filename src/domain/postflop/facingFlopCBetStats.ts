import type { AppData, SessionStats } from '../../lib/types';
import type { FacingFlopCBetPrompt } from './facingFlopCBetTrainer';

export const buildFacingFlopCBetMissKey = (prompt: FacingFlopCBetPrompt): string =>
  `${prompt.spot}|${prompt.board.join(' ')}|${prompt.heroHand.join(' ')}|${prompt.cBetSizeBucket}`;

export const reduceSessionOnFacingFlopCBetAnswer = (
  prev: SessionStats,
  evaluation: { correct: boolean },
  responseMs: number,
): SessionStats => ({
  ...prev,
  attempts: prev.attempts + 1,
  correct: prev.correct + (evaluation.correct ? 1 : 0),
  totalResponseMs: prev.totalResponseMs + responseMs,
  byDrill: {
    ...prev.byDrill,
    postflop_facing_flop_cbet: {
      attempts: prev.byDrill.postflop_facing_flop_cbet.attempts + 1,
      correct: prev.byDrill.postflop_facing_flop_cbet.correct + (evaluation.correct ? 1 : 0),
    },
  },
  byDrillResponseMs: {
    ...prev.byDrillResponseMs,
    postflop_facing_flop_cbet: prev.byDrillResponseMs.postflop_facing_flop_cbet + responseMs,
  },
  postflop: {
    ...prev.postflop,
    facingFlopCBet: {
      attempts: prev.postflop.facingFlopCBet.attempts + 1,
      correct: prev.postflop.facingFlopCBet.correct + (evaluation.correct ? 1 : 0),
      totalResponseMs: prev.postflop.facingFlopCBet.totalResponseMs + responseMs,
    },
  },
});

export const reduceDataOnFacingFlopCBetAnswer = (
  prev: AppData,
  prompt: FacingFlopCBetPrompt,
  evaluation: { correct: boolean },
  responseMs: number,
): AppData => {
  const missKey = buildFacingFlopCBetMissKey(prompt);
  const missedPrompts = evaluation.correct
    ? prev.stats.postflop.facingFlopCBet.missedPrompts
    : {
        ...prev.stats.postflop.facingFlopCBet.missedPrompts,
        [missKey]: (prev.stats.postflop.facingFlopCBet.missedPrompts[missKey] ?? 0) + 1,
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
        postflop_facing_flop_cbet: {
          attempts: prev.stats.byDrill.postflop_facing_flop_cbet.attempts + 1,
          correct: prev.stats.byDrill.postflop_facing_flop_cbet.correct + (evaluation.correct ? 1 : 0),
        },
      },
      byDrillResponseMs: {
        ...prev.stats.byDrillResponseMs,
        postflop_facing_flop_cbet: prev.stats.byDrillResponseMs.postflop_facing_flop_cbet + responseMs,
      },
      postflop: {
        ...prev.stats.postflop,
        facingFlopCBet: {
          attempts: prev.stats.postflop.facingFlopCBet.attempts + 1,
          correct: prev.stats.postflop.facingFlopCBet.correct + (evaluation.correct ? 1 : 0),
          totalResponseMs: prev.stats.postflop.facingFlopCBet.totalResponseMs + responseMs,
          missedPrompts,
        },
      },
    },
  };
};
