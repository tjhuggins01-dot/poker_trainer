import { RANKS, type HandClass, type Rank } from './types';
import { canonicalizeHandClass } from './hands';

const rankIndex = (r: string): number => RANKS.indexOf(r as Rank);

const expandPairPlus = (start: string): HandClass[] => {
  const idx = rankIndex(start);
  return RANKS.slice(0, idx + 1).map((r) => `${r}${r}` as HandClass);
};

const expandPairRange = (from: string, to: string): HandClass[] => {
  const iFrom = rankIndex(from);
  const iTo = rankIndex(to);
  const [lo, hi] = [Math.min(iFrom, iTo), Math.max(iFrom, iTo)];
  return RANKS.slice(lo, hi + 1).map((r) => `${r}${r}` as HandClass);
};

const expandNonPairPlus = (a: string, b: string, suffix: 's' | 'o'): HandClass[] => {
  const hiIdx = rankIndex(a);
  const lowStart = rankIndex(b);
  const result: HandClass[] = [];
  for (let i = lowStart; i > hiIdx; i -= 1) {
    result.push(`${a}${RANKS[i]}${suffix}` as HandClass);
  }
  return result;
};

export const parseRangeShorthand = (
  input: string,
): { ok: true; hands: HandClass[] } | { ok: false; error: string } => {
  const tokens = input
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const out = new Set<HandClass>();

  for (const token of tokens) {
    const up = token.toUpperCase();

    if (/^[AKQJT98765432]{2}-[AKQJT98765432]{2}$/.test(up)) {
      const [from, to] = up.split('-');
      if (from[0] !== from[1] || to[0] !== to[1]) {
        return { ok: false, error: `Invalid pair range: ${token}` };
      }
      expandPairRange(from[0], to[0]).forEach((h) => out.add(h));
      continue;
    }

    if (/^[AKQJT98765432]{2}\+$/.test(up)) {
      if (up[0] !== up[1]) return { ok: false, error: `Only pair plus allowed here: ${token}` };
      expandPairPlus(up[0]).forEach((h) => out.add(h));
      continue;
    }

    if (/^[AKQJT98765432]{2}[SO]\+$/.test(up)) {
      const [a, b, s] = up;
      if (a === b) return { ok: false, error: `Pairs cannot use suited/offsuit suffix: ${token}` };
      if (rankIndex(a) >= rankIndex(b)) {
        return { ok: false, error: `Use canonical order (e.g., A5s+, KJo+): ${token}` };
      }
      expandNonPairPlus(a, b, s.toLowerCase() as 's' | 'o').forEach((h) => out.add(h));
      continue;
    }

    const hand = canonicalizeHandClass(up);
    if (!hand) {
      return {
        ok: false,
        error: `Invalid token: ${token}. Use AA, AKs, AKo, 77+, A2s+, ATo+, 22-66.`,
      };
    }
    out.add(hand);
  }

  return { ok: true, hands: [...out] };
};
