import type { FlopBoard } from '../postflop/types';
import type { HandClass } from '../../lib/types';
import { computeRangeMetrics } from './rangeMetrics';
import type { ComparativeAnalysis } from './types';

export const compareRangesOnFlop = (heroRange: HandClass[], villainRange: HandClass[], flop: FlopBoard): ComparativeAnalysis => ({
  flop,
  hero: computeRangeMetrics(heroRange, flop),
  villain: computeRangeMetrics(villainRange, flop),
});
