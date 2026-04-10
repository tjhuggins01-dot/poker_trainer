import type { FlopBoard } from '../postflop/types';
import type { HandClass } from '../../lib/types';
import { filterBlockedCombos } from './blockers';
import { expandRangeToCombos } from './comboExpansion';
import { computeRangeVsRangeEquities } from './equity';
import { computeRangeMetricsFromCombos } from './rangeMetrics';
import type { ComparativeAnalysis } from './types';

type CompareRangesOptions = {
  includeEquity?: boolean;
};

export const compareRangesOnFlop = (
  heroRange: HandClass[],
  villainRange: HandClass[],
  flop: FlopBoard,
  options: CompareRangesOptions = {},
): ComparativeAnalysis => {
  const heroLive = filterBlockedCombos(expandRangeToCombos(heroRange), flop);
  const villainLive = filterBlockedCombos(expandRangeToCombos(villainRange), flop);
  const includeEquity = options.includeEquity ?? true;
  const equities = includeEquity ? computeRangeVsRangeEquities(heroLive, villainLive, flop) : { hero: null, villain: null };

  return {
    flop,
    hero: computeRangeMetricsFromCombos(heroLive, flop, { rawEquity: equities.hero }),
    villain: computeRangeMetricsFromCombos(villainLive, flop, { rawEquity: equities.villain }),
  };
};
