export type Suit = 's' | 'h' | 'd' | 'c';

export type Rank = 'A' | 'K' | 'Q' | 'J' | 'T' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';

export type Card = { rank: Rank; suit: Suit };
export type HoleCards = [Card, Card];
export type FlopBoard = [Card, Card, Card];

export type HandCategoryAnswer =
  | 'high-card'
  | 'one-pair'
  | 'two-pair'
  | 'trips'
  | 'set'
  | 'straight'
  | 'flush'
  | 'full-house'
  | 'quads';

export type PromptDifficulty = 'easy' | 'medium' | 'hard';

export type DrillExplanationBullet = {
  label: string;
  text: string;
};

export type DrillExplanation = {
  summary: string;
  bullets: DrillExplanationBullet[];
  tags?: string[];
};

export type PairSubtype =
  | 'overpair'
  | 'top-pair'
  | 'middle-pair'
  | 'bottom-pair'
  | 'underpair'
  | 'board-pair-plays';

export type DrawCategory =
  | 'none'
  | 'flush-draw'
  | 'open-ender'
  | 'gutshot'
  | 'double-gutshot'
  | 'combo-draw';

export type HandCategoryEvaluation = {
  category: HandCategoryAnswer;
  pairSubtype?: PairSubtype;
  drawCategory?: DrawCategory;
  hasBackdoorFlushDraw?: boolean;
  hasBackdoorStraightDraw?: boolean;
};

export type HandCategoryPrompt = {
  id: string;
  heroHand: HoleCards;
  board: FlopBoard;
  correctAnswer: HandCategoryAnswer;
  explanation: DrillExplanation;
  difficulty: PromptDifficulty;
};

export type PostflopMistakeTag =
  | 'misread-made-hand'
  | 'misread-pair-strength'
  | 'missed-draw'
  | 'trips-vs-set-confusion'
  | 'board-pair-confusion';
