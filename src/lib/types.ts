export const POSITIONS = ['UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN', 'SB'] as const;
export type Position = (typeof POSITIONS)[number];

export type FacingAction = 'none' | 'open' | '3bet' | '4bet';
export type Action = 'OPEN' | 'FOLD';

export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const;
export type Rank = (typeof RANKS)[number];

export type PairHandClass = `${Rank}${Rank}`;
export type SuitedHandClass = `${Rank}${Rank}s`;
export type OffsuitHandClass = `${Rank}${Rank}o`;
export type HandClass = PairHandClass | SuitedHandClass | OffsuitHandClass;

export type Situation = {
  seats: number;
  effectiveStackBb: number;
  position: Position;
  facingAction: FacingAction;
};

export type Policy = {
  openHands: HandClass[];
};

export type SituationPolicyRecord = {
  situation: Situation;
  actionSet: Action[];
  policy: Policy;
};

export type StatsEntry = { attempts: number; correct: number };

export type AppData = {
  version: 1;
  meta: { game: 'NLH'; seats: 9; effectiveStackBb: 100 };
  rangesetName: string;
  situations: Record<string, SituationPolicyRecord>;
  stats: {
    total: StatsEntry;
    byPosition: Record<Position, StatsEntry>;
    byHand: Record<string, StatsEntry>;
    mistakes: Record<string, { count: number; lastTs: number }>;
  };
  settings: {
    revealOnIncorrectOnly: boolean;
    handDisplayMode: 'class';
    randomPositionMode: 'uniform';
    randomHandMode: 'uniform169';
  };
};

export const APP_VERSION = '1.0.0';
export const STORAGE_VERSION = 1;
export const STORAGE_KEY = 'poker_range_drill_v1';
