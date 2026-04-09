import { cardToString, parseCard } from '../postflop/cards';
import type { FlopBoard } from '../postflop/types';
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
