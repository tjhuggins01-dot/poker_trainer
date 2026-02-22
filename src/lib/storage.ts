import { parseRangeShorthand } from './parser';
import {
  POSITIONS,
  STORAGE_KEY,
  STORAGE_VERSION,
  type AppData,
  type Position,
  type SituationPolicyRecord,
} from './types';

const defaults: Record<Position, string> = {
  UTG: '77+,AJs+,KQs,AQo+',
  UTG1: '66+,ATs+,KJs+,QJs,AQo+,KQo',
  UTG2: '55+,A9s+,KTs+,QTs+,JTs,ATo+,KQo',
  LJ: '44+,A7s+,KTs+,QTs+,JTs,T9s,AJo+,KQo',
  HJ: '33+,A5s+,K9s+,Q9s+,J9s+,T9s,98s,AJo+,KQo',
  CO: '22+,A2s+,K8s+,Q8s+,J8s+,T8s+,97s+,87s,A9o+,KTo+,QTo+',
  BTN: '22+,A2s+,K2s+,Q6s+,J7s+,T7s+,96s+,86s+,76s,65s,A2o+,K8o+,Q9o+,J9o+,T9o',
  SB: '22+,A2s+,K5s+,Q7s+,J8s+,T8s+,98s,87s,A2o+,K9o+,Q9o+,JTo',
};

const makeSituationRecord = (position: Position, openHands: string[]): SituationPolicyRecord => ({
  situation: { seats: 9, effectiveStackBb: 100, position, facingAction: 'none' },
  actionSet: ['OPEN', 'FOLD'],
  policy: { openHands: openHands as AppData['situations'][string]['policy']['openHands'] },
});

export const createDefaultData = (): AppData => {
  const situations: AppData['situations'] = {};
  POSITIONS.forEach((position) => {
    const parsed = parseRangeShorthand(defaults[position]);
    situations[`OPEN_9MAX_100BB_${position}`] = makeSituationRecord(
      position,
      parsed.ok ? parsed.hands : [],
    );
  });

  const byPosition = Object.fromEntries(
    POSITIONS.map((p) => [p, { attempts: 0, correct: 0 }]),
  ) as AppData['stats']['byPosition'];

  return {
    version: STORAGE_VERSION,
    meta: { game: 'NLH', seats: 9, effectiveStackBb: 100 },
    rangesetName: '9-max 100bb opens',
    situations,
    stats: {
      total: { attempts: 0, correct: 0 },
      byPosition,
      byHand: {},
      mistakes: {},
    },
    settings: {
      revealOnIncorrectOnly: true,
      handDisplayMode: 'class',
      randomPositionMode: 'uniform',
      randomHandMode: 'uniform169',
    },
  };
};

export const loadData = (): AppData => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = createDefaultData();
    saveData(initial);
    return initial;
  }
  try {
    const parsed = JSON.parse(raw) as AppData;
    if (parsed.version !== STORAGE_VERSION) throw new Error('version mismatch');
    return parsed;
  } catch {
    const initial = createDefaultData();
    saveData(initial);
    return initial;
  }
};

export const saveData = (data: AppData): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const resetStatsOnly = (data: AppData): AppData => ({
  ...data,
  stats: createDefaultData().stats,
});

export const resetAll = (): AppData => createDefaultData();
