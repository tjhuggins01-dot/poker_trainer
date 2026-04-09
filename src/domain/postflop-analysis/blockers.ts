import { cardToString } from '../postflop/cards';
import type { FlopBoard } from '../postflop/types';
import type { Combo } from './types';

export const filterBlockedCombos = (combos: Combo[], flop: FlopBoard): Combo[] => {
  const blocked = new Set(flop.map(cardToString));
  return combos.filter((combo) => !combo.hole.some((card) => blocked.has(cardToString(card))));
};

export const hasDuplicateCards = (cards: Array<{ rank: string; suit: string }>): boolean =>
  new Set(cards.map((card) => `${card.rank}${card.suit}`)).size !== cards.length;
