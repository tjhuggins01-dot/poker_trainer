import { PRESETS, facingOpenKey, type PresetId } from './presets';
import { getStackDataBundle } from './data/catalog';
import { parseRangeShorthand } from './parser';
import { DEFAULT_DRILL_CONTEXT, fromLegacyDrillType } from './domain';
import { DEFAULT_FORMAT, DEFAULT_STACK_BB, type DrillFormat, type EffectiveStackBb } from './constants';
import {
  FACING_OPEN_HERO_POSITIONS,
  FACING_OPEN_VILLAIN_BY_HERO,
  RFI_POSITIONS,
  SESSION_STORAGE_KEY,
  STORAGE_KEY,
  STORAGE_VERSION,
  type AppData,
  type FacingOpenHeroPosition,
  type Position,
  THREE_BET_HERO_POSITIONS,
  type RfiPosition,
  type SessionStats,
  type SituationPolicyRecord,
  type ThreeBetHeroPosition,
} from './types';

const LEGACY_STORAGE_KEYS = ['poker_range_drill_v1'];
const LEGACY_SESSION_KEYS = ['poker_range_drill_session_v1'];

const defaultPresetId: PresetId = 'v2_standard';

const makeRfiKey = (heroPos: RfiPosition, format: DrillFormat = 'cash6max', stack: EffectiveStackBb = 100): string => `RFI_${format}_${stack}BB_${heroPos}`;
const makeFacingOpenKey = (
  heroPos: FacingOpenHeroPosition,
  villainPos: Position,
  format: DrillFormat = 'cash6max',
  stack: EffectiveStackBb = 100,
): string => `FACING_OPEN_${format}_${stack}BB_${heroPos}_VS_${villainPos}`;
const makeThreeBetKey = (
  heroPos: ThreeBetHeroPosition,
  villainPos: Position,
  format: DrillFormat = 'cash6max',
  stack: EffectiveStackBb = 100,
): string => `THREE_BET_${format}_${stack}BB_${heroPos}_VS_${villainPos}`;

const createEmptyRfiStats = () =>
  Object.fromEntries(RFI_POSITIONS.map((p) => [p, { attempts: 0, correct: 0 }])) as Record<
    RfiPosition,
    { attempts: number; correct: number }
  >;

const createEmptyFacingStats = () =>
  Object.fromEntries(
    FACING_OPEN_HERO_POSITIONS.map((p) => [p, { attempts: 0, correct: 0 }]),
  ) as Record<FacingOpenHeroPosition, { attempts: number; correct: number }>;

const defaultFacingOpenSelection = {
  heroPos: 'UTG1' as FacingOpenHeroPosition,
  villainPos: FACING_OPEN_VILLAIN_BY_HERO.UTG1[0],
};

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
  };
  next.settings.facingOpenSelection = next.settings.facingOpenSelection ?? defaultFacingOpenSelection;
  next.settings.drillContext = next.settings.drillContext ?? {
    ...DEFAULT_DRILL_CONTEXT,
    nodeType: fromLegacyDrillType(next.settings.drillType),
    heroPos:
      next.settings.drillType === 'facing_open'
        ? next.settings.facingOpenSelection.heroPos
        : next.settings.positionFocus.rfi[0] ?? DEFAULT_DRILL_CONTEXT.heroPos,
    villainPos:
      next.settings.drillType === 'facing_open' ? next.settings.facingOpenSelection.villainPos : undefined,
  };
  return next;
};

const hasNoOverlap = (a: string[], b: string[]) => !a.some((hand) => b.includes(hand));

const makeRfiSituationRecord = (
  heroPos: RfiPosition,
  raiseHands: string[],
  limpHands: string[],
  stack: EffectiveStackBb,
): SituationPolicyRecord => ({
  situation: { game: 'NLH', table: '9max', effectiveStackBb: stack, heroPos, facingAction: 'none' },
  drillType: 'rfi',
  actionSet:
    heroPos === 'SB'
      ? [
          { id: 'RAISE', label: 'RAISE', color: 'raise' },
          { id: 'LIMP', label: 'LIMP', color: 'limp' },
          { id: 'FOLD', label: 'FOLD', color: 'fold' },
        ]
      : [
          { id: 'RAISE', label: 'RAISE', color: 'raise' },
          { id: 'FOLD', label: 'FOLD', color: 'fold' },
        ],
  policy: { raise: raiseHands as any, limp: heroPos === 'SB' ? (limpHands as any) : [] },
});

const makeFacingOpenSituationRecord = (
  heroPos: FacingOpenHeroPosition,
  villainPos: Position,
  callHands: string[],
  threeBetHands: string[],
  stack: EffectiveStackBb,
): SituationPolicyRecord => ({
  situation: {
    game: 'NLH',
    table: '9max',
    effectiveStackBb: stack,
    heroPos,
    facingAction: 'open',
    villainPos,
  },
  drillType: 'facing_open',
  actionSet: [
    { id: 'FOLD', label: 'FOLD', color: 'fold' },
    { id: 'CALL', label: 'CALL', color: 'call' },
    { id: '3BET', label: '3BET', color: 'threebet' },
  ],
  policy: { call: callHands as any, threeBet: threeBetHands as any },
});


const makeThreeBetSituationRecord = (
  heroPos: ThreeBetHeroPosition,
  villainPos: Position,
  callHands: string[],
  fourBetHands: string[],
  stack: EffectiveStackBb,
): SituationPolicyRecord => ({
  situation: {
    game: 'NLH',
    table: '9max',
    effectiveStackBb: stack,
    heroPos,
    facingAction: 'three_bet',
    villainPos,
  },
  drillType: 'three_bet',
  actionSet: [
    { id: 'FOLD', label: 'FOLD', color: 'fold' },
    { id: 'CALL', label: 'CALL', color: 'call' },
    { id: '4BET', label: '4BET', color: 'threebet' },
  ],
  policy: { call: callHands as any, fourBet: fourBetHands as any },
});

const applyFacingOpenPreset = (
  situations: AppData['situations'],
  presetId: PresetId,
  format: DrillFormat = DEFAULT_FORMAT,
  stack: EffectiveStackBb = DEFAULT_STACK_BB,
) => {
  const bundle = getStackDataBundle(format, stack);
  if (!bundle) return;
  const facingOpenSource = PRESETS[presetId]?.facingOpen ?? bundle.facingOpen;
  Object.entries(facingOpenSource).forEach(([matchupKey, range]) => {
    const match = matchupKey.match(/^FO_(.+)_VS_(.+)$/);
    if (!match) return;
    const hero = match[1] as FacingOpenHeroPosition;
    const villain = match[2] as Position;
    const call = parseRangeShorthand(range.call);
    const threeBet = parseRangeShorthand(range.threeBet);
    if (!call.ok || !threeBet.ok || !hasNoOverlap(call.hands, threeBet.hands)) return;
    situations[makeFacingOpenKey(hero, villain, format, stack)] = makeFacingOpenSituationRecord(
      hero,
      villain,
      call.hands,
      threeBet.hands,
      stack,
    );
  });
};


const applyThreeBetDefaults = (
  situations: AppData['situations'],
  format: DrillFormat = DEFAULT_FORMAT,
  stack: EffectiveStackBb = DEFAULT_STACK_BB,
) => {
  const bundle = getStackDataBundle(format, stack);
  if (!bundle) return;
  Object.entries(bundle.threeBet).forEach(([matchupKey, range]) => {
    const [hero, villain] = matchupKey.split('_VS_');
    const call = parseRangeShorthand(range.call);
    const fourBet = parseRangeShorthand(range.fourBet);
    if (!call.ok || !fourBet.ok || !hasNoOverlap(call.hands, fourBet.hands)) return;
    situations[makeThreeBetKey(hero as ThreeBetHeroPosition, villain as Position, format, stack)] = makeThreeBetSituationRecord(
      hero as ThreeBetHeroPosition,
      villain as Position,
      call.hands,
      fourBet.hands,
      stack,
    );
  });
};

export const createDefaultData = (format: DrillFormat = DEFAULT_FORMAT, stack: EffectiveStackBb = DEFAULT_STACK_BB): AppData => {
  const situations: AppData['situations'] = {};
  const bundle = getStackDataBundle(format, stack);
  const rfiDefaults = bundle?.rfi ?? PRESETS[defaultPresetId].rfi;
  RFI_POSITIONS.forEach((position) => {
    const raiseParsed = parseRangeShorthand(rfiDefaults.raise[position]);
    const limpParsed =
      position === 'SB' ? parseRangeShorthand(rfiDefaults.limp.SB) : { ok: true, hands: [] };
    situations[makeRfiKey(position, format, stack)] = makeRfiSituationRecord(
      position,
      raiseParsed.ok ? raiseParsed.hands : [],
      limpParsed.ok ? limpParsed.hands : [],
      stack,
    );
  });
  applyFacingOpenPreset(situations, defaultPresetId, format, stack);
  applyThreeBetDefaults(situations, format, stack);

  return {
    version: STORAGE_VERSION,
    meta: { game: 'NLH', table: '9max', effectiveStackBb: stack },
    rangesetName: '9-max 100bb preflop',
    situations,
    stats: {
      total: { attempts: 0, correct: 0 },
      byRfiPosition: createEmptyRfiStats(),
      byFacingHero: createEmptyFacingStats(),
      byFacingMatchup: {},
      byHand: {},
      mistakes: {},
    },
    settings: {
      revealOnIncorrectOnly: true,
      handDisplayMode: 'class',
      randomHandMode: 'uniform169',
      difficulty: 'normal',
      defaultPresetId,
      drillType: 'rfi',
      positionFocus: { rfi: [...RFI_POSITIONS], facing_open: [...FACING_OPEN_HERO_POSITIONS], three_bet: [...THREE_BET_HERO_POSITIONS] },
      facingOpenSelection: defaultFacingOpenSelection,
      drillContext: { ...DEFAULT_DRILL_CONTEXT, format, effectiveStackBb: stack },
    },
  };
};

const migrateLegacy = (rawData: any): AppData => {
  const next = createDefaultData();
  const legacySituations = rawData?.situations ?? {};
  RFI_POSITIONS.forEach((position) => {
    const oldKey = `OPEN_9MAX_100BB_${position}`;
    const oldHands: string[] = legacySituations[oldKey]?.policy?.openHands ?? [];
    next.situations[makeRfiKey(position, DEFAULT_FORMAT, DEFAULT_STACK_BB)] = makeRfiSituationRecord(position, oldHands, [], DEFAULT_STACK_BB);
  });

  if (rawData?.stats) {
    next.stats.total = rawData.stats.total ?? next.stats.total;
    next.stats.byHand = rawData.stats.byHand ?? {};
    next.stats.mistakes = rawData.stats.mistakes ?? {};
    RFI_POSITIONS.forEach((position) => {
      next.stats.byRfiPosition[position] = rawData.stats.byPosition?.[position] ?? { attempts: 0, correct: 0 };
    });
  }

  next.settings.defaultPresetId = rawData?.settings?.defaultPresetId ?? defaultPresetId;
  next.settings.difficulty = rawData?.settings?.difficulty ?? 'normal';
  next.settings.revealOnIncorrectOnly = rawData?.settings?.revealOnIncorrectOnly ?? true;
  next.migrationNotice = 'Data migrated to v2 schema. Facing-open stats were initialized.';
  return next;
};

const migrateV5ToCurrent = (record: any): AppData => {
  const next = structuredClone(record) as AppData;
  next.version = STORAGE_VERSION;
  next.settings.facingOpenSelection = next.settings.facingOpenSelection ?? defaultFacingOpenSelection;
  next.settings.drillContext = next.settings.drillContext ?? {
    ...DEFAULT_DRILL_CONTEXT,
    nodeType: fromLegacyDrillType(next.settings.drillType ?? 'rfi'),
    heroPos:
      next.settings.drillType === 'facing_open'
        ? next.settings.facingOpenSelection.heroPos
        : next.settings.positionFocus?.rfi?.[0] ?? DEFAULT_DRILL_CONTEXT.heroPos,
    villainPos:
      next.settings.drillType === 'facing_open' ? next.settings.facingOpenSelection.villainPos : undefined,
  };
  applyFacingOpenPreset(next.situations, next.settings.defaultPresetId ?? defaultPresetId);
  return next;
};

const migrateToCurrent = (rawData: unknown): AppData => {
  if (!rawData || typeof rawData !== 'object') return createDefaultData();
  const record = rawData as any;
  if (record.version === STORAGE_VERSION) return normalizeCurrentData(record);
  if (record.version === 6 || record.version === 5) return migrateV5ToCurrent(record);
  if (record.version === 4) return migrateLegacy(record);
  return migrateLegacy(record);
};

export const loadData = (): AppData => {
  const raw = localStorage.getItem(STORAGE_KEY) ?? LEGACY_STORAGE_KEYS.map((k) => localStorage.getItem(k)).find(Boolean);
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

export const createDefaultSession = (): SessionStats => ({
  version: 2,
  attempts: 0,
  correct: 0,
  byRfiPosition: createEmptyRfiStats(),
  byFacingHero: createEmptyFacingStats(),
  totalResponseMs: 0,
});

const migrateSession = (raw: any): SessionStats => {
  return normalizeSession(raw);
};

export const loadSession = (): SessionStats => {
  const raw =
    localStorage.getItem(SESSION_STORAGE_KEY) ??
    LEGACY_SESSION_KEYS.map((k) => localStorage.getItem(k)).find(Boolean);
  if (!raw) {
    const initial = createDefaultSession();
    saveSession(initial);
    return initial;
  }
  try {
    const migrated = migrateSession(JSON.parse(raw));
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

export { makeFacingOpenKey, makeRfiKey, makeThreeBetKey, facingOpenKey, hasNoOverlap };
