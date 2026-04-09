import type { FlopBoard } from '../postflop/types';
import { filterBlockedCombos } from './blockers';
import { expandRangeToCombos } from './comboExpansion';
import { detectDrawFlags } from './drawMetrics';
import { evaluateComboMadeHand } from './handStrength';
import type { SideMetrics } from './types';
import type { HandClass } from '../../lib/types';

const ratio = (numerator: number, denominator: number): number => (denominator === 0 ? 0 : numerator / denominator);

export const computeRangeMetrics = (range: HandClass[], flop: FlopBoard): SideMetrics => {
  const expanded = expandRangeToCombos(range);
  const liveCombos = filterBlockedCombos(expanded, flop);

  const evaluated = liveCombos.map((combo) => {
    const made = evaluateComboMadeHand(combo, flop);
    made.draws = detectDrawFlags(combo.hole, flop, made.category, made.isFlushMade);
    return made;
  });

  const total = evaluated.length;
  const count = (predicate: (value: (typeof evaluated)[number]) => boolean) => evaluated.filter(predicate).length;

  return {
    comboCount: total,
    onePairPlusShare: ratio(count((entry) => entry.isOnePairPlus), total),
    twoPairPlusShare: ratio(count((entry) => entry.isTwoPairPlus), total),
    tripsPlusShare: ratio(count((entry) => entry.isTripsPlus), total),
    straightPlusShare: ratio(count((entry) => entry.isStraightPlus), total),
    flushShare: ratio(count((entry) => entry.isFlushMade), total),
    flushDrawShare: ratio(count((entry) => entry.draws.hasFlushDraw), total),
    openEndedShare: ratio(count((entry) => entry.draws.hasOpenEnded), total),
    gutshotShare: ratio(count((entry) => entry.draws.hasGutshot), total),
    rawEquity: null,
  };
};
