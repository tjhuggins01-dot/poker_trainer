import type { Card } from '../domain/postflop/types';

export const SUIT_SYMBOL: Record<Card['suit'], string> = {
  s: '♠',
  h: '♥',
  d: '♦',
  c: '♣',
};

const SUIT_NAME: Record<Card['suit'], string> = {
  s: 'spades',
  h: 'hearts',
  d: 'diamonds',
  c: 'clubs',
};

export const isRedSuit = (suit: Card['suit']): boolean => suit === 'h' || suit === 'd';

export const cardAriaLabel = (card: Card): string => {
  const rankLabel =
    card.rank === 'A'
      ? 'Ace'
      : card.rank === 'K'
        ? 'King'
        : card.rank === 'Q'
          ? 'Queen'
          : card.rank === 'J'
            ? 'Jack'
            : card.rank === 'T'
              ? 'Ten'
              : card.rank;
  return `${rankLabel} of ${SUIT_NAME[card.suit]}`;
};
