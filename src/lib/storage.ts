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


const withDefaultStatsEntry = (entry: any) => ({
  attempts: typeof entry?.attempts === 'number' ? entry.attempts : 0,
  correct: typeof entry?.correct === 'number' ? entry.correct : 0,
});

const normalizeSession = (raw: any): SessionStats => {
  const next = createDefaultSession();
  next.attempts = typeof raw?.attempts === 'number' ? raw.attempts : 0;
  next.correct = typeof raw?.correct === 'number' ? raw.correct : 0;
  next.totalResponseMs = typeof raw?.totalResponseMs === 'number' ? raw.totalResponseMs : 0;
  next.byDrill = createEmptyDrillStats();
  Object.keys(next.byDrill).forEach((drill) => {
    next.byDrill[drill as keyof typeof next.byDrill] = withDefaultStatsEntry(raw?.byDrill?.[drill]);
  });
  next.byDrillResponseMs = {
    ...createEmptyDrillResponseMs(),
    ...(raw?.byDrillResponseMs ?? {}),
  };
  Object.keys(next.byDrillResponseMs).forEach((drill) => {
    const value = next.byDrillResponseMs[drill as keyof typeof next.byDrillResponseMs];
    next.byDrillResponseMs[drill as keyof typeof next.byDrillResponseMs] = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  });
  next.postflop = {
    handCategory: {
      attempts: typeof raw?.postflop?.handCategory?.attempts === 'number' ? raw.postflop.handCategory.attempts : 0,
      correct: typeof raw?.postflop?.handCategory?.correct === 'number' ? raw.postflop.handCategory.correct : 0,
      totalResponseMs: typeof raw?.postflop?.handCategory?.totalResponseMs === 'number' ? raw.postflop.handCategory.totalResponseMs : 0,
    },
  }; 
  RFI_POSITIONS.forEach((position) => {
    next.byRfiPosition[position] = withDefaultStatsEntry(raw?.byRfiPosition?.[position] ?? raw?.byPosition?.[position]);
  });
  FACING_OPEN_HERO_POSITIONS.forEach((position) => {
    next.byFacingHero[position] = withDefaultStatsEntry(raw?.byFacingHero?.[position]);
  });
  return next;
};

const normalizeCurrentData = (raw: any): AppData => {
  const next = structuredClone(raw) as AppData;
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

  Object.values(next.situations).forEach((record: any) => {
    if (record && record.actionSet && typeof record.actionSet[0] === 'string') {
      record.actionSet = record.actionSet.map((id: string) => ({
        id,
        label: id,
        color: id === 'RAISE' ? 'raise' : id === 'LIMP' ? 'limp' : id === '3BET' || id === '4BET' ? 'threebet' : id === 'CALL' ? 'call' : 'fold',
      }));
    }
  });

  next.settings = { ...defaults.settings, ...next.settings };
  next.settings.showCorrectAnswerFeedback = next.settings.showCorrectAnswerFeedback !== false;
  if (!['normal', 'hard', 'extra_hard', 'uniform'].includes(next.settings.difficulty as any)) {
    next.settings.difficulty = defaults.settings.difficulty;
  }
  next.settings.positionFocus = {
    rfi: next.settings.positionFocus?.rfi ?? defaults.settings.positionFocus.rfi,
    facing_open: next.settings.positionFocus?.facing_open ?? defaults.settings.positionFocus.facing_open,
    three_bet: next.settings.positionFocus?.three_bet ?? defaults.settings.positionFocus.three_bet,
    limp_branch: next.settings.positionFocus?.limp_branch ?? defaults.settings.positionFocus.limp_branch,
    postflop_hand_category: [],
  };
  next.settings.facingOpenSelection = {
    ...defaultFacingOpenSelection,
    ...next.settings.facingOpenSelection,
  };

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

  if (!FORMAT_IDS.includes(next.settings.drillContext.format as any)) {
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
