import {
  DEFAULT_DRILL_CONTEXT,
  fromLegacyDrillType,
  isEligibleContext,
  toLegacyDrillType,
  type DrillContext,
} from './domain';
import { FORMAT_IDS, STACK_SIZES_BB } from './constants';
import { getStackDataBundle } from './data/catalog';
import {
  createDefaultData,
  createDefaultSession,
  createEmptyDrillResponseMs,
  createEmptyDrillStats,
  createEmptyFacingStats,
  createEmptyRfiStats,
  defaultFacingOpenSelection,
} from '../domain/storage/defaultData';
import {
  FACING_OPEN_HERO_POSITIONS,
  RFI_POSITIONS,
  SESSION_STORAGE_KEY,
  STORAGE_KEY,
  type AppData,
  type SessionStats,
} from './types';

type UnknownRecord = Record<string, unknown>;
const asRecord = (value: unknown): UnknownRecord => (value && typeof value === 'object' ? (value as UnknownRecord) : {});

const withDefaultStatsEntry = (entry: unknown) => {
  const item = asRecord(entry);
  return {
    attempts: typeof item.attempts === 'number' ? item.attempts : 0,
    correct: typeof item.correct === 'number' ? item.correct : 0,
  };
};

const normalizeSession = (raw: unknown): SessionStats => {
  const rawRecord = asRecord(raw);
  const next = createDefaultSession();
  next.attempts = typeof rawRecord.attempts === 'number' ? rawRecord.attempts : 0;
  next.correct = typeof rawRecord.correct === 'number' ? rawRecord.correct : 0;
  next.totalResponseMs = typeof rawRecord.totalResponseMs === 'number' ? rawRecord.totalResponseMs : 0;
  next.byDrill = createEmptyDrillStats();
  Object.keys(next.byDrill).forEach((drill) => {
    next.byDrill[drill as keyof typeof next.byDrill] = withDefaultStatsEntry(asRecord(rawRecord.byDrill)[drill]);
  });
  next.byDrillResponseMs = {
    ...createEmptyDrillResponseMs(),
    ...(asRecord(rawRecord.byDrillResponseMs)),
  };
  Object.keys(next.byDrillResponseMs).forEach((drill) => {
    const value = next.byDrillResponseMs[drill as keyof typeof next.byDrillResponseMs];
    next.byDrillResponseMs[drill as keyof typeof next.byDrillResponseMs] = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  });
  const rawPostflop = asRecord(rawRecord.postflop);
  const rawHandCategory = asRecord(rawPostflop.handCategory);
  next.postflop = {
    handCategory: {
      attempts: typeof rawHandCategory.attempts === 'number' ? rawHandCategory.attempts : 0,
      correct: typeof rawHandCategory.correct === 'number' ? rawHandCategory.correct : 0,
      totalResponseMs: typeof rawHandCategory.totalResponseMs === 'number' ? rawHandCategory.totalResponseMs : 0,
    },
  };
  RFI_POSITIONS.forEach((position) => {
    next.byRfiPosition[position] = withDefaultStatsEntry(asRecord(rawRecord.byRfiPosition)[position] ?? asRecord(rawRecord.byPosition)[position]);
  });
  FACING_OPEN_HERO_POSITIONS.forEach((position) => {
    next.byFacingHero[position] = withDefaultStatsEntry(asRecord(rawRecord.byFacingHero)[position]);
  });
  return next;
};

const normalizeCurrentData = (raw: unknown): AppData => {
  const next = structuredClone(asRecord(raw)) as AppData;
  const defaults = createDefaultData();
  const stackDefaults = FORMAT_IDS.flatMap((format) =>
    STACK_SIZES_BB
      .filter((stack) => Boolean(getStackDataBundle(format, stack)))
      .map((stack) => createDefaultData(format, stack).situations),
  );

  next.situations = {
    ...defaults.situations,
    ...Object.assign({}, ...stackDefaults),
    ...(next.situations ?? {}),
  };
  next.stats = next.stats ?? defaults.stats;
  next.stats.total = withDefaultStatsEntry(next.stats.total);
  next.stats.byDrill = {
    ...createEmptyDrillStats(),
    ...(next.stats.byDrill ?? {}),
  };
  next.stats.byDrillResponseMs = {
    ...createEmptyDrillResponseMs(),
    ...(next.stats.byDrillResponseMs ?? {}),
  };
  Object.keys(next.stats.byDrillResponseMs).forEach((drill) => {
    const value = next.stats.byDrillResponseMs[drill as keyof typeof next.stats.byDrillResponseMs];
    next.stats.byDrillResponseMs[drill as keyof typeof next.stats.byDrillResponseMs] = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  });
  Object.keys(next.stats.byDrill).forEach((drill) => {
    next.stats.byDrill[drill as keyof typeof next.stats.byDrill] = withDefaultStatsEntry(next.stats.byDrill[drill as keyof typeof next.stats.byDrill]);
  });
  next.stats.byRfiPosition = next.stats.byRfiPosition ?? createEmptyRfiStats();
  RFI_POSITIONS.forEach((position) => {
    next.stats.byRfiPosition[position] = withDefaultStatsEntry(next.stats.byRfiPosition[position]);
  });
  next.stats.byFacingHero = next.stats.byFacingHero ?? createEmptyFacingStats();
  FACING_OPEN_HERO_POSITIONS.forEach((position) => {
    next.stats.byFacingHero[position] = withDefaultStatsEntry(next.stats.byFacingHero[position]);
  });
  next.stats.byFacingMatchup = next.stats.byFacingMatchup ?? {};
  next.stats.byHand = next.stats.byHand ?? {};
  next.stats.mistakes = next.stats.mistakes ?? {};
  next.stats.promptMemory = next.stats.promptMemory ?? {};
  next.stats.postflop = next.stats.postflop ?? defaults.stats.postflop;
  next.stats.postflop.handCategory = {
    ...defaults.stats.postflop.handCategory,
    ...(next.stats.postflop?.handCategory ?? {}),
    missedByCategory: next.stats.postflop?.handCategory?.missedByCategory ?? {},
    missedFingerprints: next.stats.postflop?.handCategory?.missedFingerprints ?? {},
    mistakeTags: next.stats.postflop?.handCategory?.mistakeTags ?? {},
  };

  if (typeof (next.stats.postflop.handCategory.missedByCategory as Record<string, number>).set === 'number') {
    const setMisses = (next.stats.postflop.handCategory.missedByCategory as Record<string, number>).set;
    next.stats.postflop.handCategory.missedByCategory.trips = (next.stats.postflop.handCategory.missedByCategory.trips ?? 0) + setMisses;
    delete (next.stats.postflop.handCategory.missedByCategory as Record<string, number>).set;
  }

  Object.values(next.situations).forEach((record) => {
    if (!record || !record.actionSet.length || typeof record.actionSet[0] !== 'string') return;
    const legacyActionSet = record.actionSet as unknown as string[];
    record.actionSet = legacyActionSet.map((id) => ({
      id,
      label: id,
      color: id === 'RAISE' ? 'raise' : id === 'LIMP' ? 'limp' : id === '3BET' || id === '4BET' ? 'threebet' : id === 'CALL' ? 'call' : 'fold',
    })) as typeof record.actionSet;
  });

  next.settings = { ...defaults.settings, ...next.settings };
  next.settings.showCorrectAnswerFeedback = next.settings.showCorrectAnswerFeedback !== false;
  if (!['normal', 'hard', 'extra_hard', 'uniform'].includes(next.settings.difficulty as never)) {
    next.settings.difficulty = defaults.settings.difficulty;
  }
  next.settings.positionFocus = {
    rfi: next.settings.positionFocus?.rfi ?? defaults.settings.positionFocus.rfi,
    facing_open: next.settings.positionFocus?.facing_open ?? defaults.settings.positionFocus.facing_open,
    three_bet: next.settings.positionFocus?.three_bet ?? defaults.settings.positionFocus.three_bet,
    limp_branch: next.settings.positionFocus?.limp_branch ?? defaults.settings.positionFocus.limp_branch,
    postflop_hand_category: [],
  };
  next.settings.villainFocus = {
    facing_open: next.settings.villainFocus?.facing_open ?? [],
    three_bet: next.settings.villainFocus?.three_bet ?? [],
    limp_branch: next.settings.villainFocus?.limp_branch ?? [],
  };
  next.settings.facingOpenSelection = {
    ...defaultFacingOpenSelection,
    ...next.settings.facingOpenSelection,
  };
  next.settings.analyzer = {
    ...defaults.settings.analyzer,
    ...(next.settings.analyzer ?? {}),
  };
  if (!FORMAT_IDS.includes(next.settings.analyzer.format as never)) {
    next.settings.analyzer.format = defaults.settings.analyzer.format;
  }
  if (
    typeof next.settings.analyzer.effectiveStackBb !== 'number'
    || !STACK_SIZES_BB.includes(next.settings.analyzer.effectiveStackBb as never)
  ) {
    next.settings.analyzer.effectiveStackBb = defaults.settings.analyzer.effectiveStackBb;
  }
  if (typeof next.settings.analyzer.spotId !== 'string') {
    next.settings.analyzer.spotId = null;
  }

  if (!['range-vs-range', 'hand-vs-range'].includes(next.settings.analyzer.mode as never)) {
    next.settings.analyzer.mode = defaults.settings.analyzer.mode;
  }
  if (!['exact', 'simplified'].includes(next.settings.analyzer.boardInputMode as never)) {
    next.settings.analyzer.boardInputMode = defaults.settings.analyzer.boardInputMode;
  }
  if (typeof next.settings.analyzer.simplifiedPresetId !== 'string') {
    next.settings.analyzer.simplifiedPresetId = null;
  }
  const analyzerExactHand = next.settings.analyzer.exactHand;
  next.settings.analyzer.exactHand =
    Array.isArray(analyzerExactHand) && analyzerExactHand.length === 2 && analyzerExactHand.every((card) => typeof card === 'string')
      ? [analyzerExactHand[0], analyzerExactHand[1]]
      : null;

  const analyzerFlop = next.settings.analyzer.flop;
  next.settings.analyzer.flop =
    Array.isArray(analyzerFlop) && analyzerFlop.length === 3 && analyzerFlop.every((card) => typeof card === 'string')
      ? [analyzerFlop[0], analyzerFlop[1], analyzerFlop[2]]
      : null;

  const legacyDrillType = next.settings.drillType === 'postflop_hand_category' ? 'rfi' : next.settings.drillType;
  const legacyNodeType = fromLegacyDrillType(legacyDrillType);
  const baseContext: DrillContext = {
    ...DEFAULT_DRILL_CONTEXT,
    nodeType: legacyNodeType,
    heroPos:
      next.settings.drillType === 'facing_open'
        ? next.settings.facingOpenSelection.heroPos
        : next.settings.drillType === 'three_bet'
          ? next.settings.positionFocus.three_bet[0] ?? DEFAULT_DRILL_CONTEXT.heroPos
          : next.settings.drillType === 'limp_branch'
            ? next.settings.positionFocus.limp_branch[0] ?? 'BB'
            : next.settings.positionFocus.rfi[0] ?? DEFAULT_DRILL_CONTEXT.heroPos,
    villainPos:
      next.settings.drillType === 'facing_open'
        ? next.settings.facingOpenSelection.villainPos
        : next.settings.drillType === 'three_bet'
          ? 'BB'
          : next.settings.drillType === 'limp_branch'
            ? (next.settings.positionFocus.limp_branch[0] === 'BB' ? 'SB' : 'BB')
            : undefined,
  };
  next.settings.drillContext = {
    ...baseContext,
    ...(next.settings.drillContext ?? {}),
  };

  if (!FORMAT_IDS.includes(next.settings.drillContext.format as never)) {
    next.settings.drillContext.format = DEFAULT_DRILL_CONTEXT.format;
  }

  if (!isEligibleContext(next.settings.drillContext, next)) {
    next.settings.drillContext = baseContext;
  }
  if (next.settings.drillType !== 'postflop_hand_category') {
    next.settings.drillType = toLegacyDrillType(next.settings.drillContext.nodeType);
  }
  return next;
};


const migrateToCurrent = (rawData: unknown): AppData => {
  if (!rawData || typeof rawData !== 'object') return createDefaultData();
  return normalizeCurrentData(rawData);
};

const createCurrentDefaultData = (): AppData => migrateToCurrent(createDefaultData());

export const loadData = (): AppData => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = createCurrentDefaultData();
    saveData(initial);
    return initial;
  }
  try {
    const migrated = migrateToCurrent(JSON.parse(raw));
    saveData(migrated);
    return migrated;
  } catch {
    const initial = createCurrentDefaultData();
    saveData(initial);
    return initial;
  }
};

export const saveData = (data: AppData): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const loadSession = (): SessionStats => {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    const initial = createDefaultSession();
    saveSession(initial);
    return initial;
  }
  try {
    const migrated = normalizeSession(JSON.parse(raw));
    saveSession(migrated);
    return migrated;
  } catch {
    const initial = createDefaultSession();
    saveSession(initial);
    return initial;
  }
};

export const saveSession = (session: SessionStats): void => {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
};

export const resetSession = (): SessionStats => {
  const fresh = createDefaultSession();
  saveSession(fresh);
  return fresh;
};

export const resetStatsOnly = (data: AppData): AppData => ({
  ...data,
  stats: createDefaultData().stats,
});

export const resetAll = (): AppData => createCurrentDefaultData();
