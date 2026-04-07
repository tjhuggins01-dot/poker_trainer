import type { Card, Rank, Suit } from './types';

const RANKS: Rank[] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const SUITS: Suit[] = ['s', 'h', 'd', 'c'];

export const isValidRank = (rank: string): rank is Rank => RANKS.includes(rank as Rank);
export const isValidSuit = (suit: string): suit is Suit => SUITS.includes(suit as Suit);

export const parseCard = (value: string): Card => {
  if (!value || value.length !== 2) throw new Error(`Invalid card string: ${value}`);
  const [rank, suit] = value.toUpperCase().split('');
  const normalizedSuit = suit.toLowerCase();
  if (!isValidRank(rank) || !isValidSuit(normalizedSuit)) {
    throw new Error(`Invalid card string: ${value}`);
  }
  return { rank, suit: normalizedSuit };
};

export const cardToString = (card: Card): string => `${card.rank}${card.suit}`;

export const createDeck = (): Card[] =>
  RANKS.flatMap((rank) => SUITS.map((suit) => ({ rank, suit })));
