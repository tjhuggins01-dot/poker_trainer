import {
  DEFAULT_DRILL_CONTEXT,
  fromLegacyDrillType,
  isEligibleContext,
  toLegacyDrillType,
  type DrillContext,
} from './domain';
import { FORMAT_IDS } from './constants';
import {
  createDefaultData,
  createDefaultSession,
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
  next.situations = {
    ...defaults.situations,
    ...(next.situations ?? {}),
  };
  next.stats = next.stats ?? defaults.stats;
  next.stats.total = withDefaultStatsEntry(next.stats.total);
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
  next.settings.positionFocus = {
    rfi: next.settings.positionFocus?.rfi ?? defaults.settings.positionFocus.rfi,
    facing_open: next.settings.positionFocus?.facing_open ?? defaults.settings.positionFocus.facing_open,
    three_bet: next.settings.positionFocus?.three_bet ?? defaults.settings.positionFocus.three_bet,
    limp_branch: next.settings.positionFocus?.limp_branch ?? defaults.settings.positionFocus.limp_branch,
  };
  next.settings.facingOpenSelection = {
    ...defaultFacingOpenSelection,
    ...next.settings.facingOpenSelection,
  };

  const legacyNodeType = fromLegacyDrillType(next.settings.drillType);
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
  next.settings.drillType = toLegacyDrillType(next.settings.drillContext.nodeType);
  return next;
};


const migrateToCurrent = (rawData: unknown): AppData => {
  if (!rawData || typeof rawData !== 'object') return createDefaultData();
  return normalizeCurrentData(rawData);
};

export const loadData = (): AppData => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = createDefaultData();
    saveData(initial);
    return initial;
  }
  try {
    const migrated = migrateToCurrent(JSON.parse(raw));
    saveData(migrated);
    return migrated;
  } catch {
    const initial = createDefaultData();
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

export const resetAll = (): AppData => createDefaultData();

