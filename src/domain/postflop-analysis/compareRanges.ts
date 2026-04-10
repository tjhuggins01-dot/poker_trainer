import type { FlopBoard } from '../postflop/types';
import type { HandClass } from '../../lib/types';
import { filterBlockedCombos } from './blockers';
import { expandRangeToCombos } from './comboExpansion';
import { computeRangeVsRangeEquities } from './equity';
import { computeRangeMetricsFromCombos } from './rangeMetrics';
import type { ComparativeAnalysis } from './types';

export const compareRangesOnFlop = (heroRange: HandClass[], villainRange: HandClass[], flop: FlopBoard): ComparativeAnalysis => {
  const heroLive = filterBlockedCombos(expandRangeToCombos(heroRange), flop);
  const villainLive = filterBlockedCombos(expandRangeToCombos(villainRange), flop);
  const equities = computeRangeVsRangeEquities(heroLive, villainLive, flop);

  return {
    flop,
    hero: computeRangeMetricsFromCombos(heroLive, flop, { rawEquity: equities.hero }),
    villain: computeRangeMetricsFromCombos(villainLive, flop, { rawEquity: equities.villain }),
  };
};
