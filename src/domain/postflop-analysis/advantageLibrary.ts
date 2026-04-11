import { createDefaultData } from '../storage/defaultData';
import { buildAnalyzerSpots } from './catalog';
import { parseCard, cardToString } from '../postflop/cards';
import { expandRangeToCombos } from './comboExpansion';
import { filterBlockedCombos } from './blockers';
import { computeRangeMetricsFromCombos } from './rangeMetrics';
import { computeRangeVsRangeEquitiesSampled } from './equity';
import type { AnalyzerSpot, ComparativeAnalysis, SideMetrics } from './types';
import type { FlopBoard } from '../postflop/types';

export type AdvantageLabel = 'hero' | 'villain' | 'close';
export type BoardFamilyTag = 'a-high-dry' | 'k-high-dry' | 'qj-high-dynamic' | 'broadway-connected' | 'middling-connected' | 'low-connected' | 'low-disconnected' | 'paired-high' | 'paired-low' | 'monotone-high' | 'monotone-low' | 'two-tone-dynamic';
export type AdvantageExplanation = { summary: string; tags: string[] };
export type AcceptedBoardLibraryEntry = { id: string; spot: 'cash9max-100-btn-vs-bb-srp-flop'; board: [string, string, string]; familyTags: BoardFamilyTag[]; rangeAdvantage: AdvantageLabel; nutAdvantage: AdvantageLabel; explanation: AdvantageExplanation };
export type CandidateBoardReviewEntry = AcceptedBoardLibraryEntry & {
  metrics: { heroRawEquity: number | null; villainRawEquity: number | null; rawEquityEdgePct: number; heroOnePairPlus: number; villainOnePairPlus: number; heroTwoPairPlus: number; villainTwoPairPlus: number; heroTripsPlus: number; villainTripsPlus: number; heroStraightPlus: number; villainStraightPlus: number; heroFlush: number; villainFlush: number };
  accepted: boolean;
  rejectionReason?: string;
};

const CANDIDATE_BOARDS: string[][] = [
  ['As', '8d', '3c'], ['Ah', '7c', '2d'], ['Ac', '9h', '4d'], ['Ad', '6s', '2h'],
  ['Ks', '8d', '2c'], ['Kh', '9s', '3d'], ['Kc', '7h', '2d'], ['Kd', 'Jc', '4s'],
  ['Qs', 'Jh', '8d'], ['Qh', 'Jd', '9c'], ['Js', 'Td', '8c'],
  ['Qs', 'Jh', 'Td'], ['Kh', 'Qd', 'Jc'], ['Qh', 'Td', '9c'], ['Jh', 'Tc', '9d'],
  ['9s', '8d', '7c'], ['Ts', '9h', '8d'], ['8h', '7d', '6c'], ['Tc', '8d', '7h'],
  ['6s', '5d', '4c'], ['7h', '6d', '5s'], ['6h', '5c', '3d'], ['5h', '4d', '3c'],
  ['7s', '4d', '2c'], ['6h', '3d', '2s'], ['8c', '5d', '2h'], ['9d', '4h', '2c'],
  ['As', 'Ad', '7c'], ['Kh', 'Kd', '4s'], ['Qh', 'Qs', '8d'], ['Ts', 'Td', '6h'],
  ['5s', '5d', '2c'], ['4h', '4d', '7s'], ['3c', '3h', '8d'], ['2s', '2d', '9h'],
  ['As', 'Js', '4s'], ['Ks', 'Ts', '3s'], ['Qs', '9s', '2s'],
  ['8c', '6c', '3c'], ['7d', '5d', '2d'], ['6h', '4h', '2h'],
  ['Ah', 'Jh', '8d'], ['Kh', 'Th', '7c'], ['Qh', '9h', '7d'], ['Jh', '9h', '6c'],
  ['Ts', '8s', '6d'], ['7s', '6s', '2d'], ['Qd', 'Td', '7c'], ['Ad', 'Td', '4c'],
];

const REQUIRED_FAMILIES: BoardFamilyTag[] = ['a-high-dry', 'k-high-dry', 'qj-high-dynamic', 'broadway-connected', 'middling-connected', 'low-connected', 'low-disconnected', 'paired-high', 'paired-low', 'monotone-high', 'monotone-low', 'two-tone-dynamic'];
const pct = (value: number) => Number((value * 100).toFixed(2));
const rankValue = (r: string) => 'AKQJT98765432'.indexOf(r);
const suitTexture = (board: FlopBoard) => new Set(board.map((card) => card.suit)).size;

const classifyBoardFamily = (board: FlopBoard): BoardFamilyTag[] => {
  const sorted = [...board].sort((a, b) => rankValue(a.rank) - rankValue(b.rank));
  const [high, , low] = sorted;
  const paired = new Set(board.map((card) => card.rank)).size < 3;
  const connected = !paired && (rankValue(low.rank) - rankValue(high.rank) <= 4);
  const texture = suitTexture(board);
  const tags: BoardFamilyTag[] = [];
  if (paired) tags.push(['A', 'K', 'Q', 'J', 'T'].includes(high.rank) ? 'paired-high' : 'paired-low');
  if (high.rank === 'A' && !connected && texture === 3) tags.push('a-high-dry');
  if (high.rank === 'K' && !connected && texture === 3) tags.push('k-high-dry');
  if ((high.rank === 'Q' || high.rank === 'J') && connected) tags.push('qj-high-dynamic');
  if (['A', 'K', 'Q', 'J'].includes(high.rank) && connected) tags.push('broadway-connected');
  if (['T', '9', '8', '7'].includes(high.rank) && connected) tags.push('middling-connected');
  if (['8', '7', '6', '5'].includes(high.rank) && connected) tags.push('low-connected');
  if (['9', '8', '7', '6', '5', '4', '3'].includes(high.rank) && !connected && !paired) tags.push('low-disconnected');
  if (texture === 1) tags.push(['A', 'K', 'Q', 'J', 'T'].includes(high.rank) ? 'monotone-high' : 'monotone-low');
  const dynamicTwoTone = texture === 2 && !paired
    && (connected || (rankValue(low.rank) - rankValue(high.rank) <= 5 && ['A', 'K', 'Q', 'J', 'T', '9'].includes(high.rank)));
  if (dynamicTwoTone) tags.push('two-tone-dynamic');
  return [...new Set(tags)];
};

const topEndProxy = (m: SideMetrics) => m.twoPairPlusShare + m.tripsPlusShare + m.straightPlusShare + m.flushShare;

const analyzeBoard = (heroRangeCombos: ReturnType<typeof expandRangeToCombos>, villainRangeCombos: ReturnType<typeof expandRangeToCombos>, flop: FlopBoard): ComparativeAnalysis => {
  const heroLive = filterBlockedCombos(heroRangeCombos, flop);
  const villainLive = filterBlockedCombos(villainRangeCombos, flop);
  const equities = computeRangeVsRangeEquitiesSampled(heroLive, villainLive, flop, { heroSamples: 20, villainSamples: 20, runoutSamples: 45 });
  return {
    flop,
    hero: computeRangeMetricsFromCombos(heroLive, flop, { rawEquity: equities.hero }),
    villain: computeRangeMetricsFromCombos(villainLive, flop, { rawEquity: equities.villain }),
  };
};

export const labelRangeAdvantage = (analysis: ComparativeAnalysis): AdvantageLabel => {
  const edgePct = ((analysis.hero.rawEquity ?? 0) - (analysis.villain.rawEquity ?? 0)) * 100;
  const onePairDelta = analysis.hero.onePairPlusShare - analysis.villain.onePairPlusShare;
  const topEndDelta = topEndProxy(analysis.hero) - topEndProxy(analysis.villain);
  if (edgePct >= 3) return 'hero';
  if (edgePct <= -3) return 'villain';
  if (edgePct >= 1.5 && onePairDelta > 0 && topEndDelta > -0.03) return 'hero';
  if (edgePct <= -1.5 && onePairDelta < 0 && topEndDelta < 0.03) return 'villain';
  return 'close';
};

export const labelNutAdvantage = (analysis: ComparativeAnalysis): AdvantageLabel => {
  const delta = topEndProxy(analysis.hero) - topEndProxy(analysis.villain);
  const buckets = [analysis.hero.twoPairPlusShare - analysis.villain.twoPairPlusShare, analysis.hero.tripsPlusShare - analysis.villain.tripsPlusShare, analysis.hero.straightPlusShare - analysis.villain.straightPlusShare, analysis.hero.flushShare - analysis.villain.flushShare];
  const heroLeads = buckets.filter((v) => v > 0.004).length;
  const villainLeads = buckets.filter((v) => v < -0.004).length;
  if (delta >= 0.03 && heroLeads >= 2 && villainLeads <= 1) return 'hero';
  if (delta <= -0.03 && villainLeads >= 2 && heroLeads <= 1) return 'villain';
  return 'close';
};

export const isMuddyContradiction = (analysis: ComparativeAnalysis, rangeLabel: AdvantageLabel, nutLabel: AdvantageLabel): boolean => {
  const equityEdge = Math.abs((analysis.hero.rawEquity ?? 0) - (analysis.villain.rawEquity ?? 0));
  if (rangeLabel !== 'close' && nutLabel !== 'close' && rangeLabel !== nutLabel && equityEdge < 0.05) return true;
  const topDelta = Math.abs(topEndProxy(analysis.hero) - topEndProxy(analysis.villain));
  return rangeLabel === 'close' && nutLabel !== 'close' && topDelta < 0.04;
};

const explanationFor = (analysis: ComparativeAnalysis, rangeLabel: AdvantageLabel, nutLabel: AdvantageLabel): AdvantageExplanation => {
  const rawEq = ((analysis.hero.rawEquity ?? 0) - (analysis.villain.rawEquity ?? 0)) * 100;
  const eqLean = rawEq >= 0 ? 'BTN' : 'BB';
  const summary = rangeLabel === 'close'
    ? `Overall range interaction is close (slight equity lean to ${eqLean}); top-end concentration is ${nutLabel}.`
    : `${eqLean} has the clearer distribution edge (${rangeLabel}) while top-end concentration is ${nutLabel}.`;
  return {
    summary,
    tags: [
      `eq:${rawEq.toFixed(1)}pp`,
      `1p+:${((analysis.hero.onePairPlusShare - analysis.villain.onePairPlusShare) * 100).toFixed(1)}pp`,
      `2p+:${((analysis.hero.twoPairPlusShare - analysis.villain.twoPairPlusShare) * 100).toFixed(1)}pp`,
    ],
  };
};

const toMetrics = (analysis: ComparativeAnalysis) => ({ heroRawEquity: analysis.hero.rawEquity, villainRawEquity: analysis.villain.rawEquity, rawEquityEdgePct: pct((analysis.hero.rawEquity ?? 0) - (analysis.villain.rawEquity ?? 0)), heroOnePairPlus: pct(analysis.hero.onePairPlusShare), villainOnePairPlus: pct(analysis.villain.onePairPlusShare), heroTwoPairPlus: pct(analysis.hero.twoPairPlusShare), villainTwoPairPlus: pct(analysis.villain.twoPairPlusShare), heroTripsPlus: pct(analysis.hero.tripsPlusShare), villainTripsPlus: pct(analysis.villain.tripsPlusShare), heroStraightPlus: pct(analysis.hero.straightPlusShare), villainStraightPlus: pct(analysis.villain.straightPlusShare), heroFlush: pct(analysis.hero.flushShare), villainFlush: pct(analysis.villain.flushShare) });
const parseBoard = (cards: string[]): FlopBoard => cards.map((card) => parseCard(card)) as FlopBoard;

export const getBtnVsBbAnalyzerSpot = (): AnalyzerSpot => {
  const spot = buildAnalyzerSpots(createDefaultData('cash9max', 100), 'cash9max', 100).find((entry) => entry.openerPos === 'BTN' && entry.callerPos === 'BB');
  if (!spot) throw new Error('Missing BTN vs BB SRP analyzer spot for cash9max 100bb defaults.');
  return spot;
};

export const generateBtnVsBbFlopAdvantageLibrary = () => {
  const spot = getBtnVsBbAnalyzerSpot();
  const heroRangeCombos = expandRangeToCombos(spot.heroRange);
  const villainRangeCombos = expandRangeToCombos(spot.villainRange);
  const accepted: AcceptedBoardLibraryEntry[] = [];
  const review: CandidateBoardReviewEntry[] = [];
  const acceptedByFingerprint = new Set<string>();
  const familyCoverage = new Set<BoardFamilyTag>();
  let closeCloseAccepted = 0;

  CANDIDATE_BOARDS.forEach((boardCards, index) => {
    const analysis = analyzeBoard(heroRangeCombos, villainRangeCombos, parseBoard(boardCards));
    const rangeAdvantage = labelRangeAdvantage(analysis);
    const nutAdvantage = labelNutAdvantage(analysis);
    const familyTags = classifyBoardFamily(analysis.flop);
    const explanation = explanationFor(analysis, rangeAdvantage, nutAdvantage);
    const board = analysis.flop.map(cardToString) as [string, string, string];
    const id = `btn-bb-srp-flop-${String(index + 1).padStart(3, '0')}`;
    const coverageNeeded = familyTags.some((tag) => REQUIRED_FAMILIES.includes(tag) && !familyCoverage.has(tag));

    let acceptedFlag = true;
    let rejectionReason: string | undefined;
    if (familyTags.length === 0) { acceptedFlag = false; rejectionReason = 'Board did not map cleanly to a target teaching family.'; }
    if (rangeAdvantage === 'close' && nutAdvantage === 'close' && !coverageNeeded && closeCloseAccepted >= 4) {
      acceptedFlag = false;
      rejectionReason = 'Both range and nut advantage are close without adding missing family coverage.';
    }
    if (acceptedFlag && isMuddyContradiction(analysis, rangeAdvantage, nutAdvantage)) { acceptedFlag = false; rejectionReason = 'Muddy or contradictory metric picture for a first-pass teaching board.'; }

    const fingerprint = `${familyTags.slice().sort().join('|')}::${rangeAdvantage}::${nutAdvantage}`;
    if (acceptedFlag && acceptedByFingerprint.has(fingerprint) && !coverageNeeded) { acceptedFlag = false; rejectionReason = 'Redundant board texture and teaching point already represented.'; }

    if (acceptedFlag) {
      acceptedByFingerprint.add(fingerprint);
      familyTags.forEach((tag) => familyCoverage.add(tag));
      accepted.push({ id, spot: 'cash9max-100-btn-vs-bb-srp-flop', board, familyTags, rangeAdvantage, nutAdvantage, explanation });
      if (rangeAdvantage === 'close' && nutAdvantage === 'close') closeCloseAccepted += 1;
    }

    review.push({ id, spot: 'cash9max-100-btn-vs-bb-srp-flop', board, familyTags, rangeAdvantage, nutAdvantage, explanation, metrics: toMetrics(analysis), accepted: acceptedFlag, rejectionReason });
  });

  return { accepted, review, coverage: [...familyCoverage].sort() };
};

