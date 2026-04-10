import { cardToString, parseCard } from '../postflop/cards';
import type { FlopBoard, HoleCards } from '../postflop/types';
import { RANKS_DESC, SUITS, type CardOption } from './types';

export const CARD_OPTIONS: CardOption[] = RANKS_DESC.flatMap((rank) =>
  SUITS.map((suit) => {
    const card = parseCard(`${rank}${suit}`);
    return { value: cardToString(card), label: cardToString(card).toUpperCase(), card };
  }),
);

export const validateFlopSelection = (selected: string[]): { ok: true; flop: FlopBoard } | { ok: false; error: string } => {
  if (selected.length !== 3 || selected.some((value) => !value)) {
    return { ok: false, error: 'Select all three flop cards.' };
  }

  if (new Set(selected).size !== selected.length) {
    return { ok: false, error: 'Flop cards must be unique.' };
  }

  try {
    const flop = selected.map((value) => parseCard(value)) as FlopBoard;
    return { ok: true, flop };
  } catch {
    return { ok: false, error: 'Invalid flop selection.' };
  }
};

export const validateExactHandSelection = (
  selected: [string, string] | null,
  flop?: FlopBoard,
): { ok: true; hand: HoleCards } | { ok: false; error: string } => {
  if (!selected || selected.some((value) => !value)) return { ok: false, error: 'Select both exact hand cards.' };
  if (selected[0] === selected[1]) return { ok: false, error: 'Exact hand cards must be unique.' };

  try {
    const hand = selected.map((value) => parseCard(value)) as HoleCards;
    if (flop) {
      const blocked = new Set(flop.map(cardToString));
      if (hand.some((card) => blocked.has(cardToString(card)))) {
        return { ok: false, error: 'Exact hand cannot use a board card.' };
      }
    }
    return { ok: true, hand };
  } catch {
    return { ok: false, error: 'Invalid exact hand selection.' };
  }
};
