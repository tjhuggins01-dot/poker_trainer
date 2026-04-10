import { makeFacingOpenKey, makeRfiKey } from '../storage/keys';
import type { DrillFormat, EffectiveStackBb } from '../../lib/constants';
import { FACING_OPEN_HERO_POSITIONS, RFI_POSITIONS, type AppData, type FacingOpenHeroPosition, type RfiPosition } from '../../lib/types';
import type { AnalyzerSpot } from './types';

const hasHands = (hands: unknown): hands is import('../../lib/types').HandClass[] => Array.isArray(hands) && hands.length > 0;

export const buildAnalyzerSpots = (data: AppData, format: DrillFormat, stack: EffectiveStackBb): AnalyzerSpot[] => {
  return RFI_POSITIONS.flatMap((openerPos) => {
    const openerRecord = data.situations[makeRfiKey(openerPos, format, stack)];
    if (!openerRecord || openerRecord.drillType !== 'rfi' || !hasHands(openerRecord.policy.raise)) {
      return [];
    }

    return FACING_OPEN_HERO_POSITIONS.flatMap((callerPos) => {
      const facingRecord = data.situations[makeFacingOpenKey(callerPos, openerPos, format, stack)];
      if (!facingRecord || facingRecord.drillType !== 'facing_open' || !hasHands(facingRecord.policy.call)) {
        return [];
      }

      return [{
        id: `${format}:${stack}:${openerPos}:${callerPos}:srp`,
        label: `${openerPos} vs ${callerPos} SRP`,
        openerPos,
        callerPos,
        format,
        effectiveStackBb: stack,
        heroRange: openerRecord.policy.raise,
        villainRange: facingRecord.policy.call,
      }];
    });
  });
};

export const parseAnalyzerSpotId = (spotId: string | null): { openerPos: RfiPosition; callerPos: FacingOpenHeroPosition } | null => {
  if (!spotId) return null;
  const parts = spotId.split(':');
  if (parts.length !== 5) return null;
  const openerPos = parts[2];
  const callerPos = parts[3];
  if (!RFI_POSITIONS.includes(openerPos as RfiPosition) || !FACING_OPEN_HERO_POSITIONS.includes(callerPos as FacingOpenHeroPosition)) {
    return null;
  }
  return { openerPos: openerPos as RfiPosition, callerPos: callerPos as FacingOpenHeroPosition };
};

export const getAnalyzerStacks = (data: AppData, format: DrillFormat): EffectiveStackBb[] => {
  const stacks = new Set<EffectiveStackBb>();
  const candidateStacks = new Set<EffectiveStackBb>();
  Object.values(data.situations).forEach((record) => {
    const stack = record.situation.effectiveStackBb;
    if (record.situation.facingAction === 'open' && stack) {
      candidateStacks.add(stack);
    }
  });
  candidateStacks.forEach((stack) => {
    if (buildAnalyzerSpots(data, format, stack).length) {
      stacks.add(stack);
    }
  });
  return [...stacks].sort((a, b) => a - b);
};
