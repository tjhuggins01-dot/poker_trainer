import { RANKS, type HandClass } from './types';

export const generateAllHandClasses169 = (): HandClass[] => {
  const all: HandClass[] = [];
  for (let row = 0; row < RANKS.length; row += 1) {
    for (let col = 0; col < RANKS.length; col += 1) {
      all.push(gridCoordToHandClass(row, col));
    }
  }
  return all;
};

export const gridCoordToHandClass = (row: number, col: number): HandClass => {
  const rowRank = RANKS[row];
  const colRank = RANKS[col];
  if (row === col) return `${rowRank}${colRank}`;
  if (row < col) return `${rowRank}${colRank}s`;
  return `${colRank}${rowRank}o`;
};

export const handClassToGridCoord = (handClass: HandClass): { row: number; col: number } => {
  if (handClass.length === 2) {
    const idx = RANKS.indexOf(handClass[0] as (typeof RANKS)[number]);
    return { row: idx, col: idx };
  }
  const r1 = handClass[0] as (typeof RANKS)[number];
  const r2 = handClass[1] as (typeof RANKS)[number];
  const sfx = handClass[2];
  const i1 = RANKS.indexOf(r1);
  const i2 = RANKS.indexOf(r2);
  if (sfx === 's') return { row: Math.min(i1, i2), col: Math.max(i1, i2) };
  return { row: Math.max(i1, i2), col: Math.min(i1, i2) };
};

export const canonicalizeHandClass = (token: string): HandClass | null => {
  const t = token.trim().toUpperCase();
  if (/^[AKQJT98765432]{2}$/.test(t)) {
    if (t[0] !== t[1]) return null;
    return t as HandClass;
  }
  if (!/^[AKQJT98765432]{2}[SO]$/.test(t)) return null;
  const [a, b, rawSfx] = t.split('');
  if (a === b) return null;
  const sfx = rawSfx.toLowerCase();
  const ia = RANKS.indexOf(a as (typeof RANKS)[number]);
  const ib = RANKS.indexOf(b as (typeof RANKS)[number]);
  const hi = ia < ib ? a : b;
  const lo = ia < ib ? b : a;
  return `${hi}${lo}${sfx}` as HandClass;
};
