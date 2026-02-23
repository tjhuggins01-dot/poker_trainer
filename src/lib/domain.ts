import {
  FACING_OPEN_HERO_POSITIONS,
  FACING_OPEN_VILLAIN_BY_HERO,
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

export const NODE_TYPES = ['rfi', 'facingOpen', 'threeBet'] as const;
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

export const toLegacyDrillType = (nodeType: NodeType): 'rfi' | 'facing_open' | 'three_bet' =>
  nodeType === 'facingOpen' ? 'facing_open' : nodeType === 'threeBet' ? 'three_bet' : 'rfi';

export const fromLegacyDrillType = (drillType: 'rfi' | 'facing_open' | 'three_bet'): NodeType =>
  drillType === 'facing_open' ? 'facingOpen' : drillType === 'three_bet' ? 'threeBet' : 'rfi';

export const contextFromSituation = (situation: Situation): DrillContext => ({
  format: DEFAULT_FORMAT,
  effectiveStackBb: situation.effectiveStackBb,
  nodeType: situation.facingAction === 'open' ? 'facingOpen' : situation.facingAction === 'three_bet' ? 'threeBet' : 'rfi',
  heroPos: situation.heroPos,
  villainPos: situation.villainPos,
});

export const toSituation = (context: DrillContext): Situation => ({
  game: 'NLH',
  table: '9max',
  effectiveStackBb: context.effectiveStackBb,
  heroPos: context.heroPos,
  facingAction: context.nodeType === 'facingOpen' ? 'open' : context.nodeType === 'threeBet' ? 'three_bet' : 'none',
  villainPos: context.nodeType === 'facingOpen' || context.nodeType === 'threeBet' ? context.villainPos : undefined,
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
  if (context.nodeType === 'rfi' && !RFI_POSITIONS.includes(context.heroPos as any)) {
    return false;
  }
  if (context.nodeType === 'threeBet') {
    if (!context.villainPos) return false;
    if (!isKnownThreeBetHero(context.heroPos)) return false;
    if (!THREE_BET_VILLAIN_BY_HERO[context.heroPos].includes(context.villainPos)) return false;
  }
  if (!isKnownPosition(context.heroPos)) return false;
  return data.situations ? true : false;
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
