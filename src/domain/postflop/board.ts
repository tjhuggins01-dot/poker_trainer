import { cardToString } from './cards';
import type { Card, HoleCards } from './types';

export const validateUniqueCards = (cards: Card[]): boolean => {
  const seen = new Set<string>();
  for (const card of cards) {
    const key = cardToString(card);
    if (seen.has(key)) return false;
    seen.add(key);
  }
  return true;
};

export const assertUniqueCards = (heroHand: HoleCards, board: Card[]): void => {
  if (!validateUniqueCards([...heroHand, ...board])) {
    throw new Error('Duplicate cards found between hero hand and board');
  }
};
