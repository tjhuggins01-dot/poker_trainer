import { makeFacingOpenKey, makeRfiKey } from '../storage/keys';
import type { DrillFormat, EffectiveStackBb } from '../../lib/constants';
import type { AppData, Position, RfiPosition } from '../../lib/types';
import type { AnalyzerSpot } from './types';

const OPENERS: RfiPosition[] = ['UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN', 'SB'];

export const buildAnalyzerSpots = (data: AppData, format: DrillFormat, stack: EffectiveStackBb): AnalyzerSpot[] => {
  return OPENERS.flatMap((openerPos) => {
    const openerRecord = data.situations[makeRfiKey(openerPos, format, stack)];
    const bbFacingRecord = data.situations[makeFacingOpenKey('BB', openerPos as Position, format, stack)];
    if (!openerRecord || !bbFacingRecord || openerRecord.drillType !== 'rfi' || bbFacingRecord.drillType !== 'facing_open') {
      return [];
    }

    return [{
      id: `${format}:${stack}:${openerPos}:BB:srp`,
      label: `${openerPos} vs BB SRP`,
      openerPos,
      callerPos: 'BB',
      format,
      effectiveStackBb: stack,
      heroRange: openerRecord.policy.raise,
      villainRange: bbFacingRecord.policy.call,
    }];
  });
};

export const getAnalyzerStacks = (data: AppData, format: DrillFormat): EffectiveStackBb[] => {
  const stacks = new Set<EffectiveStackBb>();
  Object.values(data.situations).forEach((record) => {
    const stack = record.situation.effectiveStackBb;
    if (record.situation.facingAction === 'open' && stack && buildAnalyzerSpots(data, format, stack).length) {
      stacks.add(stack);
    }
  });
  return [...stacks].sort((a, b) => a - b);
};
