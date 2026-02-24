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
const makeLimpIsoKey = (format: DrillFormat = 'cash6max', stack: EffectiveStackBb = 100): string =>
  `LIMP_ISO_${format}_${stack}BB_BB_VS_SB`;
const makeVsIsoKey = (format: DrillFormat = 'cash6max', stack: EffectiveStackBb = 100): string =>
  `VS_ISO_${format}_${stack}BB_SB_VS_BB`;

export { makeFacingOpenKey, makeRfiKey, makeThreeBetKey, makeLimpIsoKey, makeVsIsoKey };
