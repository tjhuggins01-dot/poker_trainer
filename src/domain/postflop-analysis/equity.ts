import { cardToString, createDeck } from '../postflop/cards';
import type { Card, FlopBoard, HoleCards } from '../postflop/types';
import type { Combo } from './types';

const RANK_TO_VALUE: Record<string, number> = {
  A: 14, K: 13, Q: 12, J: 11, T: 10,
  '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
};

const INVALID_SCORE = -1;
const POWER_4 = 15 ** 4;
const POWER_3 = 15 ** 3;
const POWER_2 = 15 ** 2;

type EquityCounts = { wins: number; ties: number; total: number };
type Runout = [Card, Card];
type PreparedRunout = { cards: Runout; ids: [string, string] };
type PreparedCombo = { combo: Combo; ids: [string, string] };

const encodeScore = (category: number, kickers: number[]): number =>
  category * (15 ** 5)
  + (kickers[0] ?? 0) * POWER_4
  + (kickers[1] ?? 0) * POWER_3
  + (kickers[2] ?? 0) * POWER_2
  + (kickers[3] ?? 0) * 15
  + (kickers[4] ?? 0);

const sortedDesc = (values: number[]): number[] => [...values].sort((a, b) => b - a);

const buildRankCounts = (cards: Card[]): Map<number, number> => {
  const counts = new Map<number, number>();
  cards.forEach((card) => {
    const value = RANK_TO_VALUE[card.rank];
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });
  return counts;
};

const detectStraightHigh = (values: number[]): number | null => {
  const unique = [...new Set(values)].sort((a, b) => b - a);
  if (unique.includes(14)) unique.push(1);

  for (let i = 0; i <= unique.length - 5; i += 1) {
    const window = unique.slice(i, i + 5);
    let consecutive = true;
    for (let j = 1; j < window.length; j += 1) {
      if (window[j - 1] - window[j] !== 1) {
        consecutive = false;
        break;
      }
    }
    if (consecutive) return window[0] === 1 ? 5 : window[0];
  }
  return null;
};

const evaluateFiveCardScore = (cards: Card[]): number => {
  const values = cards.map((card) => RANK_TO_VALUE[card.rank]);
  const suits = cards.map((card) => card.suit);
  const isFlush = new Set(suits).size === 1;
  const straightHigh = detectStraightHigh(values);
  const rankCounts = buildRankCounts(cards);

  const grouped = [...rankCounts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return b[0] - a[0];
  });

  if (isFlush && straightHigh != null) return encodeScore(8, [straightHigh]);
  if (grouped[0][1] === 4) return encodeScore(7, [grouped[0][0], grouped[1][0]]);
  if (grouped[0][1] === 3 && grouped[1][1] === 2) return encodeScore(6, [grouped[0][0], grouped[1][0]]);
  if (isFlush) return encodeScore(5, sortedDesc(values));
  if (straightHigh != null) return encodeScore(4, [straightHigh]);
  if (grouped[0][1] === 3) {
    const kickers = grouped.slice(1).map(([rank]) => rank).sort((a, b) => b - a);
    return encodeScore(3, [grouped[0][0], ...kickers]);
  }
  if (grouped[0][1] === 2 && grouped[1][1] === 2) {
    const pairRanks = sortedDesc([grouped[0][0], grouped[1][0]]);
    const kicker = grouped.find((entry) => entry[1] === 1)?.[0] ?? 0;
    return encodeScore(2, [...pairRanks, kicker]);
  }
  if (grouped[0][1] === 2) {
    const kickers = grouped.slice(1).map(([rank]) => rank).sort((a, b) => b - a);
    return encodeScore(1, [grouped[0][0], ...kickers]);
  }
  return encodeScore(0, sortedDesc(values));
};

const sevenCardScore = (cards: Card[]): number => {
  let best = -1;
  for (let a = 0; a < cards.length - 4; a += 1) {
    for (let b = a + 1; b < cards.length - 3; b += 1) {
      for (let c = b + 1; c < cards.length - 2; c += 1) {
        for (let d = c + 1; d < cards.length - 1; d += 1) {
          for (let e = d + 1; e < cards.length; e += 1) {
            const score = evaluateFiveCardScore([cards[a], cards[b], cards[c], cards[d], cards[e]]);
            if (score > best) best = score;
          }
        }
      }
    }
  }
  return best;
};

const buildRunouts = (blocked: Set<string>): Runout[] => {
  const available = createDeck().filter((card) => !blocked.has(cardToString(card)));
  const runouts: Runout[] = [];
  for (let i = 0; i < available.length - 1; i += 1) {
    for (let j = i + 1; j < available.length; j += 1) {
      runouts.push([available[i], available[j]]);
    }
  }
  return runouts;
};

const prepareRunoutsForFlop = (flop: FlopBoard): PreparedRunout[] =>
  buildRunouts(new Set(flop.map(cardToString))).map((cards) => ({
    cards,
    ids: [cardToString(cards[0]), cardToString(cards[1])],
  }));

const prepareCombos = (combos: Combo[]): PreparedCombo[] => combos.map((combo) => ({
  combo,
  ids: [cardToString(combo.hole[0]), cardToString(combo.hole[1])],
}));

const buildScoreTable = (prepared: PreparedCombo[], runouts: PreparedRunout[], flop: FlopBoard): number[][] =>
  prepared.map((entry) => {
    const blocked = new Set(entry.ids);
    return runouts.map((runout) => {
      if (blocked.has(runout.ids[0]) || blocked.has(runout.ids[1])) return INVALID_SCORE;
      return sevenCardScore([...entry.combo.hole, ...flop, ...runout.cards]);
    });
  });

const hasOverlap = (a: [string, string], b: [string, string]): boolean =>
  a[0] === b[0] || a[0] === b[1] || a[1] === b[0] || a[1] === b[1];

const overlapsBoard = (ids: [string, string], board: Set<string>): boolean =>
  board.has(ids[0]) || board.has(ids[1]);

const equityFromScoreRows = (heroScores: number[], villainScores: number[]): EquityCounts => {
  let wins = 0;
  let ties = 0;
  let total = 0;

  for (let i = 0; i < heroScores.length; i += 1) {
    const h = heroScores[i];
    const v = villainScores[i];
    if (h === INVALID_SCORE || v === INVALID_SCORE) continue;
    total += 1;
    if (h > v) wins += 1;
    else if (h === v) ties += 1;
  }

  return { wins, ties, total };
};

const equityFromCounts = ({ wins, ties, total }: EquityCounts): number => (total === 0 ? 0 : (wins + ties * 0.5) / total);


const pickDeterministic = <T>(items: T[], cap: number): T[] => {
  if (items.length <= cap) return items;
  const step = items.length / cap;
  const selected: T[] = [];
  for (let i = 0; i < cap; i += 1) selected.push(items[Math.floor(i * step)]);
  return selected;
};

export const computeRangeVsRangeEquitiesSampled = (
  heroCombos: Combo[],
  villainCombos: Combo[],
  flop: FlopBoard,
  options: { heroSamples?: number; villainSamples?: number; runoutSamples?: number } = {},
): { hero: number | null; villain: number | null } => {
  const boardIds = new Set(flop.map(cardToString));
  const heroPrepared = prepareCombos(heroCombos).filter((combo) => !overlapsBoard(combo.ids, boardIds));
  const villainPrepared = prepareCombos(villainCombos).filter((combo) => !overlapsBoard(combo.ids, boardIds));
  if (!heroPrepared.length || !villainPrepared.length) return { hero: null, villain: null };

  const heroSampled = pickDeterministic(heroPrepared, options.heroSamples ?? 80);
  const villainSampled = pickDeterministic(villainPrepared, options.villainSamples ?? 80);
  const runouts = pickDeterministic(prepareRunoutsForFlop(flop), options.runoutSamples ?? 220);

  const heroScores = buildScoreTable(heroSampled, runouts, flop);
  const villainScores = buildScoreTable(villainSampled, runouts, flop);

  let totalEquity = 0;
  let totalPairs = 0;

  for (let h = 0; h < heroSampled.length; h += 1) {
    for (let v = 0; v < villainSampled.length; v += 1) {
      if (hasOverlap(heroSampled[h].ids, villainSampled[v].ids)) continue;
      totalEquity += equityFromCounts(equityFromScoreRows(heroScores[h], villainScores[v]));
      totalPairs += 1;
    }
  }

  if (!totalPairs) return { hero: null, villain: null };
  const hero = totalEquity / totalPairs;
  return { hero, villain: 1 - hero };
};
export const computeHandVsHandEquity = (hero: HoleCards, villain: HoleCards, flop: FlopBoard): number => {
  const blocked = new Set([...hero, ...villain, ...flop].map(cardToString));
  const runouts = buildRunouts(blocked);
  let wins = 0;
  let ties = 0;

  for (const [turn, river] of runouts) {
    const board: Card[] = [...flop, turn, river];
    const heroScore = sevenCardScore([...hero, ...board]);
    const villainScore = sevenCardScore([...villain, ...board]);
    if (heroScore > villainScore) wins += 1;
    else if (heroScore === villainScore) ties += 1;
  }

  return equityFromCounts({ wins, ties, total: runouts.length });
};

export const computeHandVsRangeEquity = (hero: HoleCards, villainCombos: Combo[], flop: FlopBoard): number | null => {
  const heroIds: [string, string] = [cardToString(hero[0]), cardToString(hero[1])];
  const boardIds = new Set(flop.map(cardToString));
  const legal = prepareCombos(villainCombos).filter((combo) => !hasOverlap(heroIds, combo.ids) && !overlapsBoard(combo.ids, boardIds));
  if (!legal.length) return null;

  const runouts = prepareRunoutsForFlop(flop);
  const heroCombo: PreparedCombo = { combo: { id: 'hero', handClass: 'hero', hole: hero }, ids: heroIds };
  const heroScores = buildScoreTable([heroCombo], runouts, flop)[0];
  const villainScores = buildScoreTable(legal, runouts, flop);

  const equitySum = villainScores.reduce((sum, scores) => sum + equityFromCounts(equityFromScoreRows(heroScores, scores)), 0);
  return equitySum / legal.length;
};

export const computeRangeVsRangeEquities = (heroCombos: Combo[], villainCombos: Combo[], flop: FlopBoard): { hero: number | null; villain: number | null } => {
  const boardIds = new Set(flop.map(cardToString));
  const heroPrepared = prepareCombos(heroCombos).filter((combo) => !overlapsBoard(combo.ids, boardIds));
  const villainPrepared = prepareCombos(villainCombos).filter((combo) => !overlapsBoard(combo.ids, boardIds));
  if (!heroPrepared.length || !villainPrepared.length) return { hero: null, villain: null };

  const runouts = prepareRunoutsForFlop(flop);
  const heroScores = buildScoreTable(heroPrepared, runouts, flop);
  const villainScores = buildScoreTable(villainPrepared, runouts, flop);

  let totalEquity = 0;
  let totalPairs = 0;

  for (let h = 0; h < heroPrepared.length; h += 1) {
    for (let v = 0; v < villainPrepared.length; v += 1) {
      if (hasOverlap(heroPrepared[h].ids, villainPrepared[v].ids)) continue;
      totalEquity += equityFromCounts(equityFromScoreRows(heroScores[h], villainScores[v]));
      totalPairs += 1;
    }
  }

  if (!totalPairs) return { hero: null, villain: null };
  const hero = totalEquity / totalPairs;
  return { hero, villain: 1 - hero };
};
