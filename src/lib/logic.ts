import { generateAllHandClasses169, handClassToGridCoord } from './hands';
import { makeFacingOpenKey, makeRfiKey, makeThreeBetKey } from './storage';
import {
  FACING_OPEN_HERO_POSITIONS,
  FACING_OPEN_VILLAIN_BY_HERO,
  RFI_POSITIONS,
  THREE_BET_HERO_POSITIONS,
  THREE_BET_VILLAIN_BY_HERO,
  type AppData,
  type DifficultyMode,
  type DrillAction,
  type FacingOpenHeroPosition,
  type HandClass,
  type PromptMemoryEntry,
  type Position,
  type RfiPosition,
  type Situation,
  type SituationPolicyRecord,
} from './types';
import { toSituation, type DrillContext } from './domain';

const allHands = generateAllHandClasses169();

export const randomPick = <T>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

const getSituationKeyFromContext = (context: DrillContext): string => {
  if (context.nodeType === 'facingOpen' && context.villainPos) {
    return makeFacingOpenKey(
      context.heroPos as FacingOpenHeroPosition,
      context.villainPos,
      context.format,
      context.effectiveStackBb,
    );
  }
  if (context.nodeType === 'threeBet' && context.villainPos) {
    return makeThreeBetKey(context.heroPos as any, context.villainPos, context.format, context.effectiveStackBb);
  }
  return makeRfiKey(context.heroPos as RfiPosition, context.format, context.effectiveStackBb);
};

export const resolvePolicy = (
  appData: AppData,
  context: DrillContext,
): { record?: SituationPolicyRecord; key?: string } => {
  const key = getSituationKeyFromContext(context);
  const record = appData.situations[key];
  if (record) return { record, key };

  const legacyKey =
    context.nodeType === 'facingOpen' && context.villainPos
      ? makeFacingOpenKey(context.heroPos as FacingOpenHeroPosition, context.villainPos)
      : context.nodeType === 'threeBet' && context.villainPos
        ? makeThreeBetKey(context.heroPos as any, context.villainPos)
        : makeRfiKey(context.heroPos as RfiPosition);
  return { record: appData.situations[legacyKey], key: appData.situations[legacyKey] ? legacyKey : key };
};

export const computeCorrectAction = (
  appData: AppData,
  situation: Situation,
  handClass: HandClass,
): DrillAction => {
  const context: DrillContext = {
    format: appData.settings.drillContext.format,
    effectiveStackBb: situation.effectiveStackBb,
    nodeType: situation.facingAction === 'open' ? 'facingOpen' : situation.facingAction === 'three_bet' ? 'threeBet' : 'rfi',
    heroPos: situation.heroPos,
    villainPos: situation.villainPos,
  };
  const { record } = resolvePolicy(appData, context);
  if (!record) return 'FOLD';

  const foldAction = record.actionSet.find((action) => action.color === 'fold')?.id ?? 'FOLD';
  for (const action of record.actionSet) {
    if (action.color === 'fold') continue;
    const policyKey = action.id === '3BET' ? 'threeBet' : action.id === '4BET' ? 'fourBet' : action.id.toLowerCase();
    if ((record.policy as any)?.[policyKey]?.includes(handClass)) return action.id;
  }
  return foldAction;
};

type WeightedHand = { hand: HandClass; weight: number };

const MIN_EASE = 1.3;
const MAX_EASE = 3;
const DEFAULT_EASE = 2.3;
const DAY_MS = 24 * 60 * 60 * 1000;

export const buildPromptMemoryKey = (situationKey: string, hand: HandClass): string => `${situationKey}|${hand}`;

export const getPromptSignature = (situation: Situation, handClass: HandClass): string =>
  `${situation.facingAction}:${situation.heroPos}:${situation.villainPos ?? '-'}:${handClass}`;

const computeSpacedRepBoost = (memory: PromptMemoryEntry | undefined, nowTs: number): number => {
  if (!memory || memory.seenCount === 0) return 1;

  const errorRate = memory.seenCount > 0 ? memory.wrongCount / memory.seenCount : 0;
  const errorBoost = 1 + errorRate;

  const dueDelta = nowTs - memory.nextDueAt;
  const overdueBoost = dueDelta > 0 ? 1 + Math.min(dueDelta / DAY_MS, 1) * 0.75 : 1;
  const notDueSuppression = dueDelta < 0 ? Math.max(0.2, 1 - Math.min(Math.abs(dueDelta) / DAY_MS, 0.8)) : 1;

  const sinceLastSeen = Math.max(0, nowTs - memory.lastSeenAt);
  const recencySuppression = sinceLastSeen < 20_000 ? 0.15 : sinceLastSeen < 60_000 ? 0.35 : 1;

  return Math.min(Math.max(errorBoost * overdueBoost * notDueSuppression * recencySuppression, 0.05), 4);
};

const clampEase = (ease: number) => Math.min(Math.max(ease, MIN_EASE), MAX_EASE);

export const updatePromptMemory = (
  memory: PromptMemoryEntry | undefined,
  ok: boolean,
  nowTs = Date.now(),
): PromptMemoryEntry => {
  const seenCount = (memory?.seenCount ?? 0) + 1;
  const wrongCount = (memory?.wrongCount ?? 0) + (ok ? 0 : 1);
  const nextStreak = ok ? (memory?.correctStreak ?? 0) + 1 : 0;

  const previousEase = memory?.ease ?? DEFAULT_EASE;
  const ease = clampEase(previousEase + (ok ? 0.06 : -0.2));

  const priorInterval = memory ? Math.max(memory.nextDueAt - memory.lastSeenAt, 30_000) : 60_000;
  const intervalMs = ok
    ? Math.min(priorInterval * Math.max(1.15, ease - 0.15) * (1 + Math.min(nextStreak, 5) * 0.2), 14 * DAY_MS)
    : Math.max(20_000, priorInterval * 0.4);

  return {
    seenCount,
    wrongCount,
    lastSeenAt: nowTs,
    nextDueAt: nowTs + intervalMs,
    ease,
    correctStreak: nextStreak,
  };
};

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

const buildEligibleContexts = (data: AppData): DrillContext[] => {
  const base = data.settings.drillContext;
  const contexts: DrillContext[] = [];

  if (base.nodeType === 'rfi') {
    const focus = data.settings.positionFocus.rfi.length ? data.settings.positionFocus.rfi : [...RFI_POSITIONS];
    focus.forEach((heroPos) => {
      contexts.push({ ...base, heroPos, villainPos: undefined, nodeType: 'rfi' });
    });
  }

  if (base.nodeType === 'facingOpen') {
    const focusHeroes = data.settings.positionFocus.facing_open.length
      ? data.settings.positionFocus.facing_open
      : [...FACING_OPEN_HERO_POSITIONS];

    focusHeroes.forEach((heroPos) => {
      const villains = FACING_OPEN_VILLAIN_BY_HERO[heroPos];
      villains.forEach((villainPos) => {
        contexts.push({ ...base, heroPos, villainPos, nodeType: 'facingOpen' });
      });
    });
  }


  if (base.nodeType === 'threeBet') {
    const focus = data.settings.positionFocus.three_bet.length
      ? data.settings.positionFocus.three_bet
      : [...THREE_BET_HERO_POSITIONS];

    focus.forEach((heroPos) => {
      const villains = THREE_BET_VILLAIN_BY_HERO[heroPos];
      villains.forEach((villainPos) => {
        contexts.push({ ...base, heroPos, villainPos, nodeType: 'threeBet' });
      });
    });
  }

  return contexts.filter((context) => {
    const { record } = resolvePolicy(data, context);
    return Boolean(record);
  });
};

export const nextPrompt = (
  data: AppData,
  weightedMap: Record<string, WeightedHand[]>,
  recentPromptSignatures: string[] = [],
): { situation: Situation; handClass: HandClass } => {
  const eligible = buildEligibleContexts(data);
  const fallback = {
    ...data.settings.drillContext,
    nodeType: 'rfi' as const,
    heroPos: data.settings.positionFocus.rfi[0] ?? 'UTG',
    villainPos: undefined,
  };
  const pickedContext = randomPick(eligible.length ? eligible : [fallback]);

  const { key } = resolvePolicy(data, pickedContext);
  const weightedHands = key ? weightedMap[key] : undefined;

  const situation = toSituation(pickedContext);
  const recentSet = new Set(recentPromptSignatures);
  const nowTs = Date.now();

  if (!weightedHands || !data.settings.adaptiveRepetition) {
    const eligibleHands = weightedHands
      ? weightedHands.filter((item) => !recentSet.has(getPromptSignature(situation, item.hand)))
      : [];
    return {
      situation,
      handClass: weightedHands
        ? weightedPick(eligibleHands.length ? eligibleHands : weightedHands)
        : (() => { const nonRecentHands = allHands.filter((hand) => !recentSet.has(getPromptSignature(situation, hand))); return randomPick(nonRecentHands.length ? nonRecentHands : allHands); })(),
    };
  }

  const adjustedWeights = weightedHands.map((item) => {
    const memoryKey = key ? buildPromptMemoryKey(key, item.hand) : undefined;
    const memory = memoryKey ? data.stats.promptMemory[memoryKey] : undefined;
    const spacedRepBoost = computeSpacedRepBoost(memory, nowTs);
    return {
      ...item,
      weight: item.weight * spacedRepBoost,
    };
  });

  const nonRecent = adjustedWeights.filter((item) => !recentSet.has(getPromptSignature(situation, item.hand)));

  return {
    situation,
    handClass: weightedPick(nonRecent.length ? nonRecent : adjustedWeights),
  };
};
