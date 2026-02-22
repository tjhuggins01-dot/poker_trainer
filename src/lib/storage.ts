import { PRESETS, facingOpenKey, type PresetId } from './presets';
import { parseRangeShorthand } from './parser';
import {
  FACING_OPEN_HERO_POSITIONS,
  RFI_POSITIONS,
  SESSION_STORAGE_KEY,
  STORAGE_KEY,
  STORAGE_VERSION,
  type AppData,
  type FacingOpenHeroPosition,
  type Position,
  type RfiPosition,
  type SessionStats,
  type SituationPolicyRecord,
} from './types';

const LEGACY_STORAGE_KEYS = ['poker_range_drill_v1'];
const LEGACY_SESSION_KEYS = ['poker_range_drill_session_v1'];

const defaultPresetId: PresetId = 'v2_standard';

const makeRfiKey = (heroPos: RfiPosition): string => `RFI_9MAX_100BB_${heroPos}`;
const makeFacingOpenKey = (heroPos: FacingOpenHeroPosition, villainPos: Position): string =>
  `FACING_OPEN_9MAX_100BB_${heroPos}_VS_${villainPos}`;

const createEmptyRfiStats = () =>
  Object.fromEntries(RFI_POSITIONS.map((p) => [p, { attempts: 0, correct: 0 }])) as Record<
    RfiPosition,
    { attempts: number; correct: number }
  >;

const createEmptyFacingStats = () =>
  Object.fromEntries(
    FACING_OPEN_HERO_POSITIONS.map((p) => [p, { attempts: 0, correct: 0 }]),
  ) as Record<FacingOpenHeroPosition, { attempts: number; correct: number }>;

const makeRfiSituationRecord = (
  heroPos: RfiPosition,
  raiseHands: string[],
  limpHands: string[],
): SituationPolicyRecord => ({
  situation: { game: 'NLH', table: '9max', effectiveStackBb: 100, heroPos, facingAction: 'none' },
  drillType: 'rfi',
  actionSet: heroPos === 'SB' ? ['RAISE', 'LIMP', 'FOLD'] : ['RAISE', 'FOLD'],
  policy: { raise: raiseHands as any, limp: heroPos === 'SB' ? (limpHands as any) : undefined },
});

const makeFacingOpenSituationRecord = (
  heroPos: FacingOpenHeroPosition,
  villainPos: Position,
  callHands: string[],
  threeBetHands: string[],
): SituationPolicyRecord => ({
  situation: {
    game: 'NLH',
    table: '9max',
    effectiveStackBb: 100,
    heroPos,
    facingAction: 'open',
    villainPos,
  },
  drillType: 'facing_open',
  actionSet: ['FOLD', 'CALL', '3BET'],
  policy: { call: callHands as any, threeBet: threeBetHands as any },
});

export const createDefaultData = (): AppData => {
  const situations: AppData['situations'] = {};
  RFI_POSITIONS.forEach((position) => {
    const raiseParsed = parseRangeShorthand(PRESETS[defaultPresetId].rfi.raise[position]);
    const limpParsed =
      position === 'SB' ? parseRangeShorthand(PRESETS[defaultPresetId].rfi.limp.SB) : { ok: true, hands: [] };
    situations[makeRfiKey(position)] = makeRfiSituationRecord(
      position,
      raiseParsed.ok ? raiseParsed.hands : [],
      limpParsed.ok ? limpParsed.hands : [],
    );
  });

  Object.entries(PRESETS[defaultPresetId].facingOpen).forEach(([matchupKey, range]) => {
    const match = matchupKey.match(/^FO_(.+)_VS_(.+)$/);
    if (!match) return;
    const hero = match[1] as FacingOpenHeroPosition;
    const villain = match[2] as Position;
    const call = parseRangeShorthand(range.call);
    const threeBet = parseRangeShorthand(range.threeBet);
    if (!call.ok || !threeBet.ok) return;
    situations[makeFacingOpenKey(hero, villain)] = makeFacingOpenSituationRecord(
      hero,
      villain,
      call.hands,
      threeBet.hands,
    );
  });

  return {
    version: STORAGE_VERSION,
    meta: { game: 'NLH', table: '9max', effectiveStackBb: 100 },
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
      positionFocus: { rfi: [...RFI_POSITIONS], facing_open: [...FACING_OPEN_HERO_POSITIONS] },
    },
  };
};

const migrateLegacy = (rawData: any): AppData => {
  const next = createDefaultData();
  const legacySituations = rawData?.situations ?? {};
  RFI_POSITIONS.forEach((position) => {
    const oldKey = `OPEN_9MAX_100BB_${position}`;
    const oldHands: string[] = legacySituations[oldKey]?.policy?.openHands ?? [];
    next.situations[makeRfiKey(position)] = makeRfiSituationRecord(position, oldHands, []);
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

const migrateToCurrent = (rawData: unknown): AppData => {
  if (!rawData || typeof rawData !== 'object') return createDefaultData();
  const record = rawData as any;
  if (record.version === STORAGE_VERSION) return record as AppData;
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
  if (raw?.version === 2) return raw as SessionStats;
  const next = createDefaultSession();
  next.attempts = raw?.attempts ?? 0;
  next.correct = raw?.correct ?? 0;
  RFI_POSITIONS.forEach((p) => {
    next.byRfiPosition[p] = raw?.byPosition?.[p] ?? { attempts: 0, correct: 0 };
  });
  return next;
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

export { makeFacingOpenKey, makeRfiKey, facingOpenKey };
