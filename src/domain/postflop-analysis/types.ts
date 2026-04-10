import type { Card, FlopBoard, HoleCards, Suit } from '../postflop/types';
import type { Position } from '../../lib/types';

export type AnalyzerMode = 'range-vs-range' | 'hand-vs-range';
export type BoardInputMode = 'exact' | 'simplified';

export type Combo = {
  id: string;
  handClass: string;
  hole: HoleCards;
};

export type AnalyzerSpot = {
  id: string;
  label: string;
  openerPos: Position;
  callerPos: 'BB';
  format: string;
  effectiveStackBb: number;
  heroRange: import('../../lib/types').HandClass[];
  villainRange: import('../../lib/types').HandClass[];
};

export type SideMetrics = {
  comboCount: number;
  onePairPlusShare: number;
  twoPairPlusShare: number;
  tripsPlusShare: number;
  straightPlusShare: number;
  flushShare: number;
  flushDrawShare: number;
  openEndedShare: number;
  gutshotShare: number;
  rawEquity: number | null;
};

export type ComparativeAnalysis = {
  flop: FlopBoard;
  hero: SideMetrics;
  villain: SideMetrics;
};

export type HandVsRangeAnalysis = {
  flop: FlopBoard;
  hand: {
    hole: HoleCards;
    category: import('../postflop/types').HandCategoryAnswer;
    drawCategory: import('../postflop/types').DrawCategory | 'none';
    rawEquity: number | null;
  };
  range: SideMetrics;
  notes: string[];
};

export type AnalysisSummary = {
  rawEquityEdge: 'Hero' | 'Villain' | 'Close';
  topEndEdge: 'Hero' | 'Villain' | 'Close';
  notes: string[];
};

export const SUITS: Suit[] = ['s', 'h', 'd', 'c'];
export const RANKS_DESC = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const;

export type DrawFlags = {
  hasFlushDraw: boolean;
  hasOpenEnded: boolean;
  hasGutshot: boolean;
};

export type ComboEvaluation = {
  combo: Combo;
  category: import('../postflop/types').HandCategoryAnswer;
  isOnePairPlus: boolean;
  isTwoPairPlus: boolean;
  isTripsPlus: boolean;
  isStraightPlus: boolean;
  isFlushMade: boolean;
  draws: DrawFlags;
};

export type CardOption = {
  label: string;
  value: string;
  card: Card;
};
