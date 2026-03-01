import { makeFacingOpenKey, makeLimpIsoKey, makeRfiKey, makeThreeBetKey, makeVsIsoKey } from '../storage/keys';
import { type DrillFormat, type EffectiveStackBb } from '../../lib/constants';
import { type AppData, type FacingOpenHeroPosition, type RfiPosition, type Situation, type SituationPolicyRecord, type ThreeBetHeroPosition } from '../../lib/types';
import { type DrillContext } from '../../lib/domain';

export const policyKeyFromContext = (context: DrillContext): string => {
  if (context.nodeType === 'facingOpen' && context.villainPos) {
    return makeFacingOpenKey(context.heroPos as FacingOpenHeroPosition, context.villainPos, context.format, context.effectiveStackBb);
  }
  if (context.nodeType === 'threeBet' && context.villainPos) {
    return makeThreeBetKey(context.heroPos as ThreeBetHeroPosition, context.villainPos, context.format, context.effectiveStackBb);
  }
  if (context.nodeType === 'limpBranch') {
    return context.heroPos === 'BB' ? makeLimpIsoKey(context.format, context.effectiveStackBb) : makeVsIsoKey(context.format, context.effectiveStackBb);
  }
  return makeRfiKey(context.heroPos as RfiPosition, context.format, context.effectiveStackBb);
};

export const policyKeyFromSituation = (situation: Situation, format: DrillFormat, stack: EffectiveStackBb): string => {
  if (situation.facingAction === 'open' && situation.villainPos) {
    return makeFacingOpenKey(situation.heroPos as FacingOpenHeroPosition, situation.villainPos, format, stack);
  }
  if (situation.facingAction === 'three_bet' && situation.villainPos) {
    return makeThreeBetKey(situation.heroPos as ThreeBetHeroPosition, situation.villainPos, format, stack);
  }
  if (situation.facingAction === 'limp') return makeLimpIsoKey(format, stack);
  if (situation.facingAction === 'iso') return makeVsIsoKey(format, stack);
  return makeRfiKey(situation.heroPos as RfiPosition, format, stack);
};

export const resolvePolicyRecord = (
  data: AppData,
  context: DrillContext,
): { record?: SituationPolicyRecord; key: string } => {
  const key = policyKeyFromContext(context);
  const record = data.situations[key];
  if (record) return { record, key };
  return { key };
};
