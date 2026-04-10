import { cardToString } from '../postflop/cards';
import type { Card, FlopBoard } from '../postflop/types';
import type { Combo } from './types';

export const filterBlockedCombosByCards = (combos: Combo[], blockedCards: Card[]): Combo[] => {
  const blocked = new Set(blockedCards.map(cardToString));
  return combos.filter((combo) => !combo.hole.some((card) => blocked.has(cardToString(card))));
};

export const filterBlockedCombos = (combos: Combo[], flop: FlopBoard): Combo[] => filterBlockedCombosByCards(combos, flop);

export const hasDuplicateCards = (cards: Array<{ rank: string; suit: string }>): boolean =>
  new Set(cards.map((card) => `${card.rank}${card.suit}`)).size !== cards.length;
