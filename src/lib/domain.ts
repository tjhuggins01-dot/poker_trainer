import {
  FACING_OPEN_HERO_POSITIONS,
  FACING_OPEN_VILLAIN_BY_HERO,
  POSITIONS,
  RFI_POSITIONS,
  type AppData,
  type FacingOpenHeroPosition,
  type Position,
  type Situation,
} from './types';

export const DRILL_FORMATS = ['cash6max'] as const;
export type DrillFormat = (typeof DRILL_FORMATS)[number];

export const EFFECTIVE_STACKS = [30, 60, 100, 150] as const;
export type EffectiveStackBb = (typeof EFFECTIVE_STACKS)[number];

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
  format: 'cash6max',
  effectiveStackBb: 100,
  nodeType: 'rfi',
  heroPos: 'UTG',
};

export const toLegacyDrillType = (nodeType: NodeType): 'rfi' | 'facing_open' =>
  nodeType === 'facingOpen' ? 'facing_open' : 'rfi';

export const fromLegacyDrillType = (drillType: 'rfi' | 'facing_open'): NodeType =>
  drillType === 'facing_open' ? 'facingOpen' : 'rfi';

export const contextFromSituation = (situation: Situation): DrillContext => ({
  format: 'cash6max',
  effectiveStackBb: 100,
  nodeType: situation.facingAction === 'open' ? 'facingOpen' : 'rfi',
  heroPos: situation.heroPos,
  villainPos: situation.villainPos,
});

export const toSituation = (context: DrillContext): Situation => ({
  game: 'NLH',
  table: '9max',
  effectiveStackBb: 100,
  heroPos: context.heroPos,
  facingAction: context.nodeType === 'facingOpen' ? 'open' : 'none',
  villainPos: context.nodeType === 'facingOpen' ? context.villainPos : undefined,
});

const isKnownPosition = (value: string): value is Position => POSITIONS.includes(value as Position);
const isKnownFacingHero = (value: string): value is FacingOpenHeroPosition =>
  FACING_OPEN_HERO_POSITIONS.includes(value as FacingOpenHeroPosition);

export const isEligibleContext = (context: DrillContext, data: AppData): boolean => {
  if (context.nodeType === 'facingOpen') {
    if (!context.villainPos) return false;
    if (!isKnownFacingHero(context.heroPos)) return false;
    if (!FACING_OPEN_VILLAIN_BY_HERO[context.heroPos].includes(context.villainPos)) return false;
  }
  if (context.nodeType === 'rfi' && !RFI_POSITIONS.includes(context.heroPos as any)) {
    return false;
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
