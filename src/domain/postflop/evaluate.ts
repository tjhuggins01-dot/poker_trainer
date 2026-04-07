import { assertUniqueCards } from './board';
import { detectDrawCategory, hasBackdoorFlushDraw, hasBackdoorStraightDraw } from './draws';
import type { Card, FlopBoard, HandCategoryAnswer, HandCategoryEvaluation, HoleCards, PairSubtype } from './types';

const RANK_TO_VALUE: Record<string, number> = { A: 14, K: 13, Q: 12, J: 11, T: 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 };

const countByRank = (cards: Card[]) => cards.reduce<Record<string, number>>((acc, c) => ({ ...acc, [c.rank]: (acc[c.rank] ?? 0) + 1 }), {});
const countBySuit = (cards: Card[]) => cards.reduce<Record<string, number>>((acc, c) => ({ ...acc, [c.suit]: (acc[c.suit] ?? 0) + 1 }), {});

const hasStraight = (cards: Card[]): boolean => {
  const values = [...new Set(cards.map((card) => RANK_TO_VALUE[card.rank]))].sort((a, b) => a - b);
  if (values.includes(14)) values.unshift(1);
  let run = 1;
  for (let i = 1; i < values.length; i += 1) {
    if (values[i] === values[i - 1] + 1) run += 1;
    else run = 1;
    if (run >= 5) return true;
  }
  return false;
};

const getPairSubtype = (heroHand: HoleCards, board: FlopBoard): PairSubtype | undefined => {
  const [h1, h2] = heroHand;
  const boardValues = board.map((card) => RANK_TO_VALUE[card.rank]).sort((a, b) => b - a);
  const top = boardValues[0];
  const middle = boardValues[1];

  if (h1.rank === h2.rank) {
    const hv = RANK_TO_VALUE[h1.rank];
    if (hv > top) return 'overpair';
    if (board.some((b) => b.rank === h1.rank)) return 'board-pair-plays';
    return 'underpair';
  }

  const pairedRanks = heroHand.filter((hero) => board.some((card) => card.rank === hero.rank));
  if (!pairedRanks.length) return undefined;
  const best = Math.max(...pairedRanks.map((c) => RANK_TO_VALUE[c.rank]));
  if (best === top) return 'top-pair';
  if (best === middle) return 'middle-pair';
  return 'bottom-pair';
};

const classifyCategory = (heroHand: HoleCards, board: FlopBoard): HandCategoryAnswer => {
  const cards = [...heroHand, ...board];
  const rankCounts = Object.values(countByRank(cards)).sort((a, b) => b - a);
  const suitCounts = Object.values(countBySuit(cards));

  if (rankCounts[0] === 4) return 'quads';
  if (rankCounts[0] === 3 && rankCounts[1] === 2) return 'full-house';
  if (suitCounts.some((count) => count >= 5)) return 'flush';
  if (hasStraight(cards)) return 'straight';

  const heroPocketPair = heroHand[0].rank === heroHand[1].rank;
  const matchesBoard = board.some((card) => card.rank === heroHand[0].rank) || board.some((card) => card.rank === heroHand[1].rank);
  if (heroPocketPair && matchesBoard) return 'set';

  if (rankCounts[0] === 3) return 'trips';
  if (rankCounts[0] === 2 && rankCounts[1] === 2) return 'two-pair';
  if (rankCounts[0] === 2) return 'one-pair';
  return 'high-card';
};

export const evaluateFlopHandCategory = (heroHand: HoleCards, board: FlopBoard): HandCategoryEvaluation => {
  assertUniqueCards(heroHand, board);
  const category = classifyCategory(heroHand, board);

  return {
    category,
    pairSubtype: category === 'one-pair' ? getPairSubtype(heroHand, board) : undefined,
    drawCategory: detectDrawCategory(heroHand, board),
    hasBackdoorFlushDraw: hasBackdoorFlushDraw(heroHand, board),
    hasBackdoorStraightDraw: hasBackdoorStraightDraw(heroHand, board),
  };
};
