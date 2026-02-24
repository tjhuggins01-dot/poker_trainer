import {
  FACING_OPEN_HERO_POSITIONS,
  FACING_OPEN_VILLAIN_BY_HERO,
  LIMP_BRANCH_HERO_POSITIONS,
  POSITIONS,
  RFI_POSITIONS,
  THREE_BET_HERO_POSITIONS,
  THREE_BET_VILLAIN_BY_HERO,
  type AppData,
  type FacingOpenHeroPosition,
  type Position,
  type ThreeBetHeroPosition,
  type Situation,
} from './types';
import {
  DEFAULT_FORMAT,
  DEFAULT_STACK_BB,
  FORMAT_IDS,
  STACK_SIZES_BB,
  type DrillFormat,
  type EffectiveStackBb,
} from './constants';

export const DRILL_FORMATS = FORMAT_IDS;
export const EFFECTIVE_STACKS = STACK_SIZES_BB;

export const NODE_TYPES = ['rfi', 'facingOpen', 'threeBet', 'limpBranch'] as const;
export type NodeType = (typeof NODE_TYPES)[number];

export type DrillContext = {
  format: DrillFormat;
  effectiveStackBb: EffectiveStackBb;
  nodeType: NodeType;
  heroPos: Position;
  villainPos?: Position;
};

export const DEFAULT_DRILL_CONTEXT: DrillContext = {
  format: DEFAULT_FORMAT,
  effectiveStackBb: DEFAULT_STACK_BB,
  nodeType: 'rfi',
  heroPos: 'UTG',
};

export const toLegacyDrillType = (nodeType: NodeType): 'rfi' | 'facing_open' | 'three_bet' | 'limp_branch' =>
  nodeType === 'facingOpen' ? 'facing_open' : nodeType === 'threeBet' ? 'three_bet' : nodeType === 'limpBranch' ? 'limp_branch' : 'rfi';

export const fromLegacyDrillType = (drillType: 'rfi' | 'facing_open' | 'three_bet' | 'limp_branch'): NodeType =>
  drillType === 'facing_open' ? 'facingOpen' : drillType === 'three_bet' ? 'threeBet' : drillType === 'limp_branch' ? 'limpBranch' : 'rfi';

export const contextFromSituation = (situation: Situation): DrillContext => ({
  format: DEFAULT_FORMAT,
  effectiveStackBb: situation.effectiveStackBb,
  nodeType:
    situation.facingAction === 'open'
      ? 'facingOpen'
      : situation.facingAction === 'three_bet'
        ? 'threeBet'
        : situation.facingAction === 'limp' || situation.facingAction === 'iso'
          ? 'limpBranch'
          : 'rfi',
  heroPos: situation.heroPos,
  villainPos: situation.villainPos,
});

export const toSituation = (context: DrillContext): Situation => ({
  game: 'NLH',
  table: '9max',
  effectiveStackBb: context.effectiveStackBb,
  heroPos: context.heroPos,
  facingAction:
    context.nodeType === 'facingOpen'
      ? 'open'
      : context.nodeType === 'threeBet'
        ? 'three_bet'
        : context.nodeType === 'limpBranch'
          ? context.heroPos === 'BB'
            ? 'limp'
            : 'iso'
          : 'none',
  villainPos: context.nodeType === 'rfi' ? undefined : context.villainPos,
});

const isKnownPosition = (value: string): value is Position => POSITIONS.includes(value as Position);
const isKnownFacingHero = (value: string): value is FacingOpenHeroPosition =>
  FACING_OPEN_HERO_POSITIONS.includes(value as FacingOpenHeroPosition);
const isKnownThreeBetHero = (value: string): value is ThreeBetHeroPosition =>
  THREE_BET_HERO_POSITIONS.includes(value as ThreeBetHeroPosition);

export const isEligibleContext = (context: DrillContext, data: AppData): boolean => {
  if (context.nodeType === 'facingOpen') {
    if (!context.villainPos) return false;
    if (!isKnownFacingHero(context.heroPos)) return false;
    if (!FACING_OPEN_VILLAIN_BY_HERO[context.heroPos].includes(context.villainPos)) return false;
  }
  if (context.nodeType === 'rfi' && !RFI_POSITIONS.includes(context.heroPos as any)) return false;
  if (context.nodeType === 'threeBet') {
    if (!context.villainPos) return false;
    if (!isKnownThreeBetHero(context.heroPos)) return false;
    if (!THREE_BET_VILLAIN_BY_HERO[context.heroPos].includes(context.villainPos)) return false;
  }
  if (context.nodeType === 'limpBranch') {
    if (!LIMP_BRANCH_HERO_POSITIONS.includes(context.heroPos as any)) return false;
    if ((context.heroPos === 'BB' && context.villainPos !== 'SB') || (context.heroPos === 'SB' && context.villainPos !== 'BB')) return false;
  }
  if (!isKnownPosition(context.heroPos)) return false;

  const expectedFacingAction =
    context.nodeType === 'facingOpen'
      ? 'open'
      : context.nodeType === 'threeBet'
        ? 'three_bet'
        : context.nodeType === 'limpBranch'
          ? context.heroPos === 'BB'
            ? 'limp'
            : 'iso'
          : 'none';

  return Object.values(data.situations ?? {}).some((record) => {
    const situation = record?.situation;
    if (!situation) return false;
    if (situation.effectiveStackBb !== context.effectiveStackBb) return false;
    if (situation.heroPos !== context.heroPos) return false;
    if (situation.facingAction !== expectedFacingAction) return false;
    return expectedFacingAction === 'none' ? true : situation.villainPos === context.villainPos;
  });
};

export const parseContextQuery = (query: URLSearchParams): Partial<DrillContext> => {
  const format = query.get('format');
  const stack = query.get('stack');
  const node = query.get('node');
  const heroPos = query.get('hero');
  const villainPos = query.get('villain');

  return {
    format: DRILL_FORMATS.includes(format as DrillFormat) ? (format as DrillFormat) : undefined,
    effectiveStackBb: EFFECTIVE_STACKS.includes(Number(stack) as EffectiveStackBb)
      ? (Number(stack) as EffectiveStackBb)
      : undefined,
    nodeType: NODE_TYPES.includes(node as NodeType) ? (node as NodeType) : undefined,
    heroPos: heroPos && isKnownPosition(heroPos) ? heroPos : undefined,
    villainPos: villainPos && isKnownPosition(villainPos) ? villainPos : undefined,
  };
};
