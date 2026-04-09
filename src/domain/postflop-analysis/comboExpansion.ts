import type { HandClass } from '../../lib/types';
import { parseCard } from '../postflop/cards';
import type { Combo } from './types';
import { SUITS } from './types';

const makeComboId = (a: string, b: string): string => [a, b].sort().join('');

const asCombo = (handClass: HandClass, c1: string, c2: string): Combo => ({
  id: makeComboId(c1, c2),
  handClass,
  hole: [parseCard(c1), parseCard(c2)],
});

export const expandHandClassToCombos = (handClass: HandClass): Combo[] => {
  const [r1, r2, suffix] = handClass as string;
  if (!suffix) {
    const combos: Combo[] = [];
    for (let i = 0; i < SUITS.length; i += 1) {
      for (let j = i + 1; j < SUITS.length; j += 1) {
        combos.push(asCombo(handClass, `${r1}${SUITS[i]}`, `${r2}${SUITS[j]}`));
      }
    }
    return combos;
  }

  if (suffix === 's') {
    return SUITS.map((suit) => asCombo(handClass, `${r1}${suit}`, `${r2}${suit}`));
  }

  const combos: Combo[] = [];
  SUITS.forEach((s1) => {
    SUITS.forEach((s2) => {
      if (s1 === s2) return;
      combos.push(asCombo(handClass, `${r1}${s1}`, `${r2}${s2}`));
    });
  });
  return combos;
};

export const expandRangeToCombos = (range: HandClass[]): Combo[] => {
  const deduped = new Map<string, Combo>();
  range.forEach((handClass) => {
    expandHandClassToCombos(handClass).forEach((combo) => {
      if (!deduped.has(combo.id)) deduped.set(combo.id, combo);
    });
  });
  return [...deduped.values()];
};
