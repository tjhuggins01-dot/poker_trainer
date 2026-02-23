export const POSITIONS = ['UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'] as const;
export type Position = (typeof POSITIONS)[number];

export const RFI_POSITIONS = ['UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN', 'SB'] as const;
export type RfiPosition = (typeof RFI_POSITIONS)[number];

export const FACING_OPEN_HERO_POSITIONS = ['UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'] as const;
export type FacingOpenHeroPosition = (typeof FACING_OPEN_HERO_POSITIONS)[number];

export const THREE_BET_HERO_POSITIONS = ['LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'] as const;
export type ThreeBetHeroPosition = (typeof THREE_BET_HERO_POSITIONS)[number];

export const FACING_OPEN_VILLAIN_BY_HERO: Record<FacingOpenHeroPosition, Position[]> = {
  UTG1: ['UTG'],
  UTG2: ['UTG', 'UTG1'],
  LJ: ['UTG', 'UTG1', 'UTG2'],
  HJ: ['UTG', 'UTG1', 'UTG2', 'LJ'],
  CO: ['UTG', 'UTG1', 'UTG2', 'LJ', 'HJ'],
  BTN: ['UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO'],
  SB: ['UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN'],
  BB: ['UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN', 'SB'],
};

export const THREE_BET_VILLAIN_BY_HERO: Record<ThreeBetHeroPosition, Position[]> = {
  LJ: ['HJ', 'CO', 'BTN', 'SB', 'BB'],
  HJ: ['CO', 'BTN', 'SB', 'BB'],
  CO: ['BTN', 'SB', 'BB'],
  BTN: ['SB', 'BB'],
  SB: ['BB'],
  BB: ['SB'],
};

export type DrillType = 'rfi' | 'facing_open' | 'three_bet';
export type TableFormat = '9max';

export type EffectiveStackBb = import('./constants').EffectiveStackBb;
export type FacingAction = 'none' | 'open' | 'three_bet';

export type DrillAction = string;

export type ActionColor = 'raise' | 'limp' | 'call' | 'threebet' | 'fold';

export type PolicyAction = {
  id: string;
  label: string;
  color: ActionColor;
};

export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const;
export type Rank = (typeof RANKS)[number];

export type PairHandClass = `${Rank}${Rank}`;
export type SuitedHandClass = `${Rank}${Rank}s`;
export type OffsuitHandClass = `${Rank}${Rank}o`;
export type HandClass = PairHandClass | SuitedHandClass | OffsuitHandClass;

export type Situation = {
  game: 'NLH';
  table: TableFormat;
  effectiveStackBb: EffectiveStackBb;
  heroPos: Position;
  facingAction: FacingAction;
  villainPos?: Position;
};

export type ActionPolicy = Record<string, HandClass[]>;

export type SituationPolicyRecord = {
  situation: Situation;
  drillType: DrillType;
  actionSet: PolicyAction[];
  policy: ActionPolicy;
};

export type StatsEntry = { attempts: number; correct: number };

export type MistakeEntry = { count: number; lastTs: number };

export type DifficultyMode = 'normal' | 'hard' | 'uniform';

export type AppData = {
  version: 7;
  meta: { game: 'NLH'; table: '9max'; effectiveStackBb: EffectiveStackBb };
  rangesetName: string;
  situations: Record<string, SituationPolicyRecord>;
  stats: {
    total: StatsEntry;
    byRfiPosition: Record<RfiPosition, StatsEntry>;
    byFacingHero: Record<FacingOpenHeroPosition, StatsEntry>;
    byFacingMatchup: Record<string, StatsEntry>;
    byHand: Record<string, StatsEntry>;
    mistakes: Record<string, MistakeEntry>;
  };
  settings: {
    revealOnIncorrectOnly: boolean;
    handDisplayMode: 'class';
    randomHandMode: 'uniform169';
    difficulty: DifficultyMode;
    defaultPresetId: import('./presets').PresetId;
    drillType: DrillType;
    positionFocus: {
      rfi: RfiPosition[];
      facing_open: FacingOpenHeroPosition[];
      three_bet: ThreeBetHeroPosition[];
    };
    facingOpenSelection: {
      heroPos: FacingOpenHeroPosition;
      villainPos: Position;
    };
    drillContext: import('./domain').DrillContext;
  };
  migrationNotice?: string;
};

export type SessionStats = {
  version: 2;
  attempts: number;
  correct: number;
  byRfiPosition: Record<RfiPosition, StatsEntry>;
  byFacingHero: Record<FacingOpenHeroPosition, StatsEntry>;
  totalResponseMs: number;
};

export const APP_VERSION = '2.0.0';
export const STORAGE_VERSION = 7;
export const STORAGE_KEY = 'poker_range_drill_v2';
export const SESSION_STORAGE_KEY = 'poker_range_drill_session_v2';
