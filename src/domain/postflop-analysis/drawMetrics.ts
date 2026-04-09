import type { Card, FlopBoard, HoleCards } from '../postflop/types';
import type { DrawFlags } from './types';

const RANK_TO_VALUE: Record<string, number> = {
  A: 14,
  K: 13,
  Q: 12,
  J: 11,
  T: 10,
  '9': 9,
  '8': 8,
  '7': 7,
  '6': 6,
  '5': 5,
  '4': 4,
  '3': 3,
  '2': 2,
};

const uniqueSorted = (values: number[]) => [...new Set(values)].sort((a, b) => a - b);

const straightDrawOuts = (cards: Card[]) => {
  const values = cards.map((card) => RANK_TO_VALUE[card.rank]);
  const unique = uniqueSorted([...values, ...(values.includes(14) ? [1] : [])]);

  const endpointOuts = new Set<number>();
  const interiorOuts = new Set<number>();
  const normalizeOut = (value: number) => (value === 1 ? 14 : value);

  for (let start = 1; start <= 10; start += 1) {
    const run = [start, start + 1, start + 2, start + 3, start + 4];
    const hits = run.filter((value) => unique.includes(value));
    if (hits.length === 4) {
      const missing = run.find((value) => !unique.includes(value));
      if (missing) {
        if (missing === start || missing === start + 4) endpointOuts.add(normalizeOut(missing));
        else interiorOuts.add(normalizeOut(missing));
      }
    } 
  }

  const hasOpenEnded = endpointOuts.size >= 2;
  const hasGutshot = !hasOpenEnded && (interiorOuts.size > 0 || endpointOuts.size === 1);

  return { hasOpenEnded, hasGutshot };
};

const hasMadeStraightOrBetter = (category: string): boolean =>
  ['straight', 'flush', 'full-house', 'quads', 'straight-flush'].includes(category);

export const detectDrawFlags = (hole: HoleCards, flop: FlopBoard, category: string, isFlushMade: boolean): DrawFlags => {
  const cards = [...hole, ...flop];

  const suitCounts = cards.reduce<Record<string, number>>((acc, card) => {
    acc[card.suit] = (acc[card.suit] ?? 0) + 1;
    return acc;
  }, {});

  const hasFlushDraw = !isFlushMade && Object.values(suitCounts).some((count) => count === 4);

  if (hasMadeStraightOrBetter(category)) {
    return { hasFlushDraw, hasOpenEnded: false, hasGutshot: false };
  }

  const { hasOpenEnded, hasGutshot } = straightDrawOuts(cards);

  return {
    hasFlushDraw,
    hasOpenEnded,
    hasGutshot,
  };
};
