import type { FlopBoard, HoleCards } from '../postflop/types';
import type { HandClass } from '../../lib/types';
import { expandRangeToCombos } from './comboExpansion';
import { filterBlockedCombosByCards } from './blockers';
import { computeHandVsRangeEquity } from './equity';
import { computeRangeMetricsFromCombos } from './rangeMetrics';
import type { HandVsRangeAnalysis } from './types';
import { evaluateFlopHandCategory } from '../postflop/evaluate';

export const analyzeHandVsRange = (heroHand: HoleCards, villainRange: HandClass[], flop: FlopBoard): HandVsRangeAnalysis => {
  const rangeCombos = filterBlockedCombosByCards(expandRangeToCombos(villainRange), [...flop, ...heroHand]);
  const equity = computeHandVsRangeEquity(heroHand, rangeCombos, flop);
  const category = evaluateFlopHandCategory(heroHand, flop);

  const rangeMetrics = computeRangeMetricsFromCombos(rangeCombos, flop);

  const notes: string[] = [];
  if (equity == null) notes.push('No legal range combos remain after blockers.');
  else if (equity > 0.55) notes.push('This hand has a small equity edge versus the selected range on this flop.');
  else if (equity < 0.45) notes.push('This hand appears to trail the selected range on this flop.');
  else notes.push('This appears close in equity versus the selected range on this flop.');

  if (rangeMetrics.twoPairPlusShare > 0.22) notes.push('The range retains meaningful top-end coverage.');

  return {
    flop,
    hand: {
      hole: heroHand,
      category: category.category,
      drawCategory: category.drawCategory ?? 'none',
      rawEquity: equity,
    },
    range: {
      ...rangeMetrics,
      rawEquity: equity == null ? null : 1 - equity,
    },
    notes,
  };
};
