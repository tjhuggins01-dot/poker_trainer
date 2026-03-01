import { generateAllHandClasses169, handClassToGridCoord } from './hands';
import { resolvePolicyRecord } from '../domain/policy/resolver';
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
  type Position,
  type PromptMemoryEntry,
  type Situation,
  type SituationPolicyRecord,
} from './types';
import { toSituation, type DrillContext } from './domain';

const allHands = generateAllHandClasses169();

export const randomPick = <T>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

export const resolvePolicy = (
  appData: AppData,
  context: DrillContext,
): { record?: SituationPolicyRecord; key?: string } => {
  return resolvePolicyRecord(appData, context);
};

export const computeCorrectAction = (
  appData: AppData,
  situation: Situation,
  handClass: HandClass,
): DrillAction => {
  const context: DrillContext = {
    format: appData.settings.drillContext.format,
    effectiveStackBb: situation.effectiveStackBb,
    nodeType: situation.facingAction === 'open' ? 'facingOpen' : situation.facingAction === 'three_bet' ? 'threeBet' : (situation.facingAction === 'limp' || situation.facingAction === 'iso') ? 'limpBranch' : 'rfi',
    heroPos: situation.heroPos,
    villainPos: situation.villainPos,
  };
  const { record } = resolvePolicy(appData, context);
  if (!record) return 'FOLD';

  const foldAction = record.actionSet.find((action) => action.color === 'fold')?.id ?? 'FOLD';
  if (record.drillType === 'rfi') {
    if (record.policy.raise.includes(handClass)) return 'RAISE';
    if (record.policy.limp?.includes(handClass)) return 'LIMP';
    return foldAction;
  }
  if (record.drillType === 'facing_open') {
    if (record.policy.call.includes(handClass)) return 'CALL';
    if (record.policy.threeBet.includes(handClass)) return '3BET';
    return foldAction;
  }
  if (record.drillType === 'three_bet') {
    if (record.policy.call.includes(handClass)) return 'CALL';
    if (record.policy.fourBet.includes(handClass)) return '4BET';
    return foldAction;
  }
  if (record.situation.facingAction === 'limp') {
    const limpPolicy = record.policy as { isoRaise: HandClass[] };
    if (limpPolicy.isoRaise.includes(handClass)) return 'ISO';
    return 'CHECK';
  }
  const isoPolicy = record.policy as { call: HandClass[]; threeBet: HandClass[] };
  if (isoPolicy.call.includes(handClass)) return 'CALL';
  if (isoPolicy.threeBet.includes(handClass)) return '3BET';
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
    const priorityHands: HandClass[] =
      record.drillType === 'facing_open'
        ? record.policy.call
        : record.drillType === 'rfi'
          ? record.policy.raise
          : record.drillType === 'three_bet'
            ? record.policy.call
            : record.situation.facingAction === 'limp'
              ? (record.policy as { isoRaise: HandClass[] }).isoRaise
              : (record.policy as { call: HandClass[] }).call;
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


  if (base.nodeType === 'limpBranch') {
    const focus = data.settings.positionFocus.limp_branch.length
      ? data.settings.positionFocus.limp_branch
      : (['BB', 'SB'] as const);

    focus.forEach((heroPos) => {
      const villainPos = heroPos === 'BB' ? 'SB' : 'BB';
      contexts.push({ ...base, heroPos, villainPos, nodeType: 'limpBranch' });
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
