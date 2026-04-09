import { evaluateFlopHandCategory } from '../postflop/evaluate';
import type { ComboEvaluation } from './types';
import type { Combo } from './types';
import type { FlopBoard } from '../postflop/types';

export const evaluateComboMadeHand = (combo: Combo, flop: FlopBoard): ComboEvaluation => {
  const evaluated = evaluateFlopHandCategory(combo.hole, flop);
  const category = evaluated.category;

  const isOnePairPlus = category !== 'high-card';
  const isTwoPairPlus = ['two-pair', 'trips', 'straight', 'flush', 'full-house', 'quads', 'straight-flush'].includes(category);
  const isTripsPlus = ['trips', 'straight', 'flush', 'full-house', 'quads', 'straight-flush'].includes(category);
  const isStraightPlus = ['straight', 'flush', 'full-house', 'quads', 'straight-flush'].includes(category);
  const isFlushMade = ['flush', 'straight-flush'].includes(category);

  return {
    combo,
    category,
    isOnePairPlus,
    isTwoPairPlus,
    isTripsPlus,
    isStraightPlus,
    isFlushMade,
    draws: { hasFlushDraw: false, hasOpenEnded: false, hasGutshot: false },
  };
};
