import { PRESETS, type PresetId } from './presets';
import { parseRangeShorthand } from './parser';
import {
  POSITIONS,
  SESSION_STORAGE_KEY,
  STORAGE_KEY,
  STORAGE_VERSION,
  type AppData,
  type Position,
  type SessionStats,
  type SituationPolicyRecord,
} from './types';

const defaultPresetId: PresetId = 'v2_standard';

const makeSituationRecord = (position: Position, openHands: string[]): SituationPolicyRecord => ({
  situation: { seats: 9, effectiveStackBb: 100, position, facingAction: 'none' },
  actionSet: ['OPEN', 'FOLD'],
  policy: { openHands: openHands as AppData['situations'][string]['policy']['openHands'] },
});

const createEmptyByPosition = (): Record<Position, { attempts: number; correct: number }> =>
  Object.fromEntries(POSITIONS.map((p) => [p, { attempts: 0, correct: 0 }])) as Record<
    Position,
    { attempts: number; correct: number }
  >;

export const createDefaultData = (): AppData => {
  const situations: AppData['situations'] = {};
  POSITIONS.forEach((position) => {
    const parsed = parseRangeShorthand(PRESETS[defaultPresetId].defaults[position]);
    situations[`OPEN_9MAX_100BB_${position}`] = makeSituationRecord(
      position,
      parsed.ok ? parsed.hands : [],
    );
  });

  return {
    version: STORAGE_VERSION,
    meta: { game: 'NLH', seats: 9, effectiveStackBb: 100 },
    rangesetName: '9-max 100bb opens',
    situations,
    stats: {
      total: { attempts: 0, correct: 0 },
      byPosition: createEmptyByPosition(),
      byHand: {},
      mistakes: {},
    },
    settings: {
      revealOnIncorrectOnly: true,
      handDisplayMode: 'class',
      randomPositionMode: 'uniform',
      randomHandMode: 'uniform169',
      difficulty: 'normal',
      defaultPresetId,
    },
  };
};

const migrateToCurrent = (rawData: unknown): AppData => {
  if (!rawData || typeof rawData !== 'object') return createDefaultData();
  const record = rawData as Record<string, unknown>;

  if (record.version === STORAGE_VERSION) {
    return record as AppData;
  }

  if (record.version === 2) {
    const v2 = record as Omit<AppData, 'version' | 'settings'> & {
      version: 2;
      settings: Omit<AppData['settings'], 'defaultPresetId'>;
    };
    return {
      ...v2,
      version: STORAGE_VERSION,
      settings: {
        ...v2.settings,
        defaultPresetId,
      },
    };
  }

  if (record.version === 1) {
    const v1 = record as Omit<AppData, 'version' | 'settings'> & {
      version: 1;
      settings: Omit<AppData['settings'], 'difficulty' | 'defaultPresetId'>;
    };
    return {
      ...v1,
      version: STORAGE_VERSION,
      settings: {
        ...v1.settings,
        difficulty: 'normal',
        defaultPresetId,
      },
    };
  }

  return createDefaultData();
};

export const loadData = (): AppData => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = createDefaultData();
    saveData(initial);
    return initial;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    const migrated = migrateToCurrent(parsed);
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
  version: 1,
  attempts: 0,
  correct: 0,
  byPosition: createEmptyByPosition(),
});

export const loadSession = (): SessionStats => {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    const initial = createDefaultSession();
    saveSession(initial);
    return initial;
  }
  try {
    const parsed = JSON.parse(raw) as SessionStats;
    if (parsed.version !== 1) throw new Error('session version mismatch');
    return parsed;
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
