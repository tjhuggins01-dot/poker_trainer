import { generateAllHandClasses169, handClassToGridCoord } from './hands';
import { makeFacingOpenKey, makeRfiKey } from './storage';
import {
  FACING_OPEN_HERO_POSITIONS,
  RFI_POSITIONS,
  type AppData,
  type DifficultyMode,
  type DrillAction,
  type DrillType,
  type FacingOpenHeroPosition,
  type HandClass,
  type Position,
  type RfiPosition,
  type Situation,
} from './types';

const allHands = generateAllHandClasses169();

export const randomPick = <T>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

export const computeCorrectAction = (
  appData: AppData,
  situation: Situation,
  handClass: HandClass,
): DrillAction => {
  if (situation.facingAction === 'open' && situation.villainPos) {
    const key = makeFacingOpenKey(situation.heroPos as FacingOpenHeroPosition, situation.villainPos);
    const policy = appData.situations[key]?.policy as any;
    if (policy?.threeBet?.includes(handClass)) return '3BET';
    if (policy?.call?.includes(handClass)) return 'CALL';
    return 'FOLD';
  }

  const key = makeRfiKey(situation.heroPos as RfiPosition);
  const policy = appData.situations[key]?.policy as any;
  if (policy?.raise?.includes(handClass)) return 'RAISE';
  if (situation.heroPos === 'SB' && policy?.limp?.includes(handClass)) return 'LIMP';
  return 'FOLD';
};

type WeightedHand = { hand: HandClass; weight: number };

const distanceBetweenHands = (a: HandClass, b: HandClass): number => {
  const aCoord = handClassToGridCoord(a);
  const bCoord = handClassToGridCoord(b);
  return Math.abs(aCoord.row - bCoord.row) + Math.abs(aCoord.col - bCoord.col);
};

const computeBoundaryDistances = (actionHands: HandClass[]): Record<HandClass, number> => {
  const actionSet = new Set(actionHands);
  const opposite = allHands.filter((hand) => !actionSet.has(hand));
  const distances: Record<HandClass, number> = {} as Record<HandClass, number>;

  allHands.forEach((hand) => {
    const target = actionSet.has(hand) ? opposite : actionHands;
    if (target.length === 0) {
      distances[hand] = allHands.length;
      return;
    }
    let minDistance = Number.POSITIVE_INFINITY;
    target.forEach((other) => {
      const distance = distanceBetweenHands(hand, other);
      if (distance < minDistance) minDistance = distance;
    });
    distances[hand] = minDistance;
  });

  return distances;
};

const difficultyWeight = (distance: number, mode: DifficultyMode): number => {
  if (mode === 'uniform') return 1;
  if (mode === 'hard') return 1 / (distance + 0.25) ** 2;
  return 1 / (distance + 1);
};

export const buildWeightedHandMap = (data: AppData): Record<string, WeightedHand[]> => {
  const bySituation: Record<string, WeightedHand[]> = {};

  Object.entries(data.situations).forEach(([key, record]) => {
    const policy = record.policy as any;
    const priorityHands: HandClass[] = record.drillType === 'facing_open' ? policy.call ?? [] : policy.raise ?? [];
    const boundaryDistances = computeBoundaryDistances(priorityHands);
    bySituation[key] = allHands.map((hand) => ({
      hand,
      weight: Math.max(difficultyWeight(boundaryDistances[hand], data.settings.difficulty), 0.0001),
    }));
  });

  return bySituation;
};

const weightedPick = (weights: WeightedHand[]): HandClass => {
  const total = weights.reduce((sum, item) => sum + item.weight, 0);
  const roll = Math.random() * total;
  let running = 0;
  for (const item of weights) {
    running += item.weight;
    if (running >= roll) return item.hand;
  }
  return weights[weights.length - 1].hand;
};

export const getFacingOpenPairs = (data: AppData): Array<{ heroPos: FacingOpenHeroPosition; villainPos: Position }> =>
  Object.values(data.situations)
    .filter((s) => s.drillType === 'facing_open' && s.situation.villainPos)
    .map((s) => ({
      heroPos: s.situation.heroPos as FacingOpenHeroPosition,
      villainPos: s.situation.villainPos as Position,
    }));

export const nextPrompt = (
  data: AppData,
  weightedMap: Record<string, WeightedHand[]>,
): { situation: Situation; handClass: HandClass } => {
  const drillType: DrillType = data.settings.drillType;
  if (drillType === 'rfi') {
    const focus = data.settings.positionFocus.rfi.length ? data.settings.positionFocus.rfi : [...RFI_POSITIONS];
    const heroPos = randomPick([...focus]);
    const key = makeRfiKey(heroPos);
    const weightedHands = weightedMap[key];
    return {
      situation: { game: 'NLH', table: '9max', effectiveStackBb: 100, heroPos, facingAction: 'none' },
      handClass: weightedHands ? weightedPick(weightedHands) : randomPick(allHands),
    };
  }

  const focusHeroes = data.settings.positionFocus.facing_open.length
    ? data.settings.positionFocus.facing_open
    : [...FACING_OPEN_HERO_POSITIONS];
  const pairs = getFacingOpenPairs(data).filter((pair) => focusHeroes.includes(pair.heroPos));
  const picked = randomPick(pairs.length ? pairs : getFacingOpenPairs(data));
  const key = makeFacingOpenKey(picked.heroPos, picked.villainPos);
  const weightedHands = weightedMap[key];
  return {
    situation: {
      game: 'NLH',
      table: '9max',
      effectiveStackBb: 100,
      heroPos: picked.heroPos,
      facingAction: 'open',
      villainPos: picked.villainPos,
    },
    handClass: weightedHands ? weightedPick(weightedHands) : randomPick(allHands),
  };
};
