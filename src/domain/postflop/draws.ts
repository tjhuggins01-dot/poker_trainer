import type { Card, DrawCategory, FlopBoard, HoleCards } from './types';

const RANK_TO_VALUE: Record<string, number> = { A: 14, K: 13, Q: 12, J: 11, T: 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 };

const uniqueSorted = (values: number[]) => [...new Set(values)].sort((a, b) => a - b);

const getStraightDrawShape = (cards: Card[]): { outs: Set<number>; hasOpenEnder: boolean } => {
  const vals = cards.map((c) => RANK_TO_VALUE[c.rank]);
  const unique = uniqueSorted([...vals, ...(vals.includes(14) ? [1] : [])]);
  const outs = new Set<number>();
  let hasOpenEnder = false;
  for (let start = 1; start <= 10; start += 1) {
    const seq = [start, start + 1, start + 2, start + 3, start + 4];
    const hits = seq.filter((v) => unique.includes(v));
    if (hits.length === 4) {
      const missing = seq.find((v) => !unique.includes(v));
      if (missing) outs.add(missing);
    }
    const fourCardRun = [start, start + 1, start + 2, start + 3];
    if (fourCardRun.every((v) => unique.includes(v))) hasOpenEnder = true;
  }
  return { outs, hasOpenEnder };
};

export const detectDrawCategory = (heroHand: HoleCards, board: FlopBoard): DrawCategory => {
  const cards = [...heroHand, ...board];
  const bySuit = new Map<string, number>();
  cards.forEach((card) => bySuit.set(card.suit, (bySuit.get(card.suit) ?? 0) + 1));
  const hasFlushDraw = [...bySuit.values()].some((count) => count === 4);

  const { outs, hasOpenEnder } = getStraightDrawShape(cards);
  const hasGutshot = outs.size === 1;
  const hasDoubleGutshot = outs.size >= 2 && !hasOpenEnder;

  if (hasFlushDraw && (hasOpenEnder || hasGutshot || hasDoubleGutshot)) return 'combo-draw';
  if (hasFlushDraw) return 'flush-draw';
  if (hasDoubleGutshot) return 'double-gutshot';
  if (hasOpenEnder) return 'open-ender';
  if (hasGutshot) return 'gutshot';
  return 'none';
};

export const hasBackdoorFlushDraw = (heroHand: HoleCards, board: FlopBoard): boolean => {
  const cards = [...heroHand, ...board];
  const bySuit = new Map<string, number>();
  cards.forEach((card) => bySuit.set(card.suit, (bySuit.get(card.suit) ?? 0) + 1));
  return [...bySuit.values()].some((count) => count === 3);
};

export const hasBackdoorStraightDraw = (heroHand: HoleCards, board: FlopBoard): boolean => {
  const { outs } = getStraightDrawShape([...heroHand, ...board]);
  return outs.size >= 1;
};
