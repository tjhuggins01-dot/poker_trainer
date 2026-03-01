export const POSITIONS = ['UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'] as const;
export type Position = (typeof POSITIONS)[number];

export const RFI_POSITIONS = ['UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN', 'SB'] as const;
export type RfiPosition = (typeof RFI_POSITIONS)[number];

export const FACING_OPEN_HERO_POSITIONS = ['UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'] as const;
export type FacingOpenHeroPosition = (typeof FACING_OPEN_HERO_POSITIONS)[number];

export const THREE_BET_HERO_POSITIONS = ['UTG', 'UTG1', 'UTG2', 'LJ', 'HJ', 'CO', 'BTN', 'SB'] as const;
export type ThreeBetHeroPosition = (typeof THREE_BET_HERO_POSITIONS)[number];

export const LIMP_BRANCH_HERO_POSITIONS = ['BB', 'SB'] as const;
export type LimpBranchHeroPosition = (typeof LIMP_BRANCH_HERO_POSITIONS)[number];

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
  UTG: ['HJ', 'CO', 'BTN', 'SB', 'BB'],
  UTG1: ['HJ', 'CO', 'BTN', 'SB', 'BB'],
  UTG2: ['HJ', 'CO', 'BTN', 'SB', 'BB'],
  LJ: ['HJ', 'CO', 'BTN', 'SB', 'BB'],
  HJ: ['CO', 'BTN', 'SB', 'BB'],
  CO: ['BTN', 'SB', 'BB'],
  BTN: ['SB', 'BB'],
  SB: ['BB'],
};

export type DrillType = 'rfi' | 'facing_open' | 'three_bet' | 'limp_branch';
export type TableFormat = '9max';

export type EffectiveStackBb = import('./constants').EffectiveStackBb;
export type FacingAction = 'none' | 'open' | 'three_bet' | 'limp' | 'iso';

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

export type RfiPolicy = {
  raise: HandClass[];
  limp?: HandClass[];
};

export type FacingOpenPolicy = {
  call: HandClass[];
  threeBet: HandClass[];
};

export type ThreeBetPolicy = {
  call: HandClass[];
  fourBet: HandClass[];
};

export type LimpIsoPolicy = {
  isoRaise: HandClass[];
};

export type VsIsoPolicy = {
  call: HandClass[];
  threeBet: HandClass[];
};

export type RfiAction = PolicyAction & { id: 'RAISE' | 'LIMP' | 'FOLD' };
export type FacingOpenAction = PolicyAction & { id: 'FOLD' | 'CALL' | '3BET' };
export type ThreeBetAction = PolicyAction & { id: 'FOLD' | 'CALL' | '4BET' };
export type LimpIsoAction = PolicyAction & { id: 'CHECK' | 'ISO' };
export type VsIsoAction = PolicyAction & { id: 'FOLD' | 'CALL' | '3BET' };

export type RfiSituationPolicyRecord = {
  situation: Situation & { facingAction: 'none'; heroPos: RfiPosition; villainPos?: undefined };
  drillType: 'rfi';
  actionSet: RfiAction[];
  policy: RfiPolicy;
};

export type FacingOpenSituationPolicyRecord = {
  situation: Situation & { facingAction: 'open'; heroPos: FacingOpenHeroPosition; villainPos: Position };
  drillType: 'facing_open';
  actionSet: FacingOpenAction[];
  policy: FacingOpenPolicy;
};

export type ThreeBetSituationPolicyRecord = {
  situation: Situation & { facingAction: 'three_bet'; heroPos: ThreeBetHeroPosition; villainPos: Position };
  drillType: 'three_bet';
  actionSet: ThreeBetAction[];
  policy: ThreeBetPolicy;
};

export type LimpIsoSituationPolicyRecord = {
  situation: Situation & { facingAction: 'limp'; heroPos: 'BB'; villainPos: 'SB' };
  drillType: 'limp_branch';
  actionSet: LimpIsoAction[];
  policy: LimpIsoPolicy;
};

export type VsIsoSituationPolicyRecord = {
  situation: Situation & { facingAction: 'iso'; heroPos: 'SB'; villainPos: 'BB' };
  drillType: 'limp_branch';
  actionSet: VsIsoAction[];
  policy: VsIsoPolicy;
};

export type SituationPolicyRecord =
  | RfiSituationPolicyRecord
  | FacingOpenSituationPolicyRecord
  | ThreeBetSituationPolicyRecord
  | LimpIsoSituationPolicyRecord
  | VsIsoSituationPolicyRecord;

export type StatsEntry = { attempts: number; correct: number };

export type MistakeEntry = { count: number; lastTs: number };

export type PromptMemoryEntry = {
  seenCount: number;
  wrongCount: number;
  lastSeenAt: number;
  nextDueAt: number;
  ease: number;
  correctStreak: number;
};

export type DifficultyMode = 'normal' | 'hard' | 'uniform';
export type ThemeMode = 'system' | 'light' | 'dark';

export type AppData = {
  version: 10;
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
    promptMemory: Record<string, PromptMemoryEntry>;
  };
  settings: {
    revealOnIncorrectOnly: boolean;
    adaptiveRepetition: boolean;
    handDisplayMode: 'class';
    randomHandMode: 'uniform169';
    difficulty: DifficultyMode;
    themeMode: ThemeMode;
    defaultPresetId: import('./presets').PresetId;
    drillType: DrillType;
    positionFocus: {
      rfi: RfiPosition[];
      facing_open: FacingOpenHeroPosition[];
      three_bet: ThreeBetHeroPosition[];
      limp_branch: LimpBranchHeroPosition[];
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
export const STORAGE_VERSION = 10;
export const STORAGE_KEY = 'poker_range_drill_v2';
export const SESSION_STORAGE_KEY = 'poker_range_drill_session_v2';
