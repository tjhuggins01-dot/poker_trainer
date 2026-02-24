import { type DrillFormat, type EffectiveStackBb } from '../../lib/constants';
import { type FacingOpenHeroPosition, type Position, type RfiPosition, type ThreeBetHeroPosition } from '../../lib/types';

const makeRfiKey = (heroPos: RfiPosition, format: DrillFormat = 'cash6max', stack: EffectiveStackBb = 100): string => `RFI_${format}_${stack}BB_${heroPos}`;
const makeFacingOpenKey = (
  heroPos: FacingOpenHeroPosition,
  villainPos: Position,
  format: DrillFormat = 'cash6max',
  stack: EffectiveStackBb = 100,
): string => `FACING_OPEN_${format}_${stack}BB_${heroPos}_VS_${villainPos}`;
const makeThreeBetKey = (
  heroPos: ThreeBetHeroPosition,
  villainPos: Position,
  format: DrillFormat = 'cash6max',
  stack: EffectiveStackBb = 100,
): string => `THREE_BET_${format}_${stack}BB_${heroPos}_VS_${villainPos}`;

export { makeFacingOpenKey, makeRfiKey, makeThreeBetKey };
