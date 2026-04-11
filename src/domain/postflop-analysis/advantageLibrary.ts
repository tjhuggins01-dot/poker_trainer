import { createDefaultData } from '../storage/defaultData';
import { buildAnalyzerSpots } from './catalog';
import { parseCard, cardToString } from '../postflop/cards';
import { expandRangeToCombos } from './comboExpansion';
import { filterBlockedCombos } from './blockers';
import { computeRangeMetricsFromCombos } from './rangeMetrics';
import { computeRangeVsRangeEquitiesSampled } from './equity';
import type { DrillFormat, EffectiveStackBb } from '../../lib/constants';
import type { FacingOpenHeroPosition, RfiPosition } from '../../lib/types';
import type { AnalyzerSpot, ComparativeAnalysis, SideMetrics } from './types';
import type { FlopBoard } from '../postflop/types';
import { getAdvantageSpotConfigById } from './advantageLibrarySpots';

export type AdvantageLabel = 'hero' | 'villain' | 'close';
export type BoardFamilyTag =
  | 'a-high-dry'
  | 'k-high-dry'
  | 'qj-high-dynamic'
  | 'broadway-connected'
  | 'middling-connected'
  | 'low-connected'
  | 'low-disconnected'
  | 'paired-high'
  | 'paired-low'
  | 'monotone-high'
  | 'monotone-low'
  | 'two-tone-dynamic';
export type AdvantageExplanation = { summary: string; tags: string[] };

export type SpotDescriptor = {
  format: DrillFormat;
  effectiveStackBb: EffectiveStackBb;
  openerPos: RfiPosition;
  callerPos: FacingOpenHeroPosition;
  street: 'flop';
};

export type AdvantageRubricThresholds = {
  clearRangeEdgePct: number;
  mixedRangeEdgePct: number;
  muddyContradictionEdgePct: number;
  nutDeltaForLead: number;
  bucketLeadThreshold: number;
  weakTopEndDeltaForCloseRange: number;
};

export type SpotGenerationOptions = {
  minAccepted: number;
  maxAccepted: number;
  maxCloseCloseWithoutCoverage: number;
  requiredFamilies: BoardFamilyTag[];
};

export type BoardCandidateSource = {
  id: string;
  boards: ReadonlyArray<readonly [string, string, string]>;
};

export type AdvantageSpotConfig = {
  id: string;
  descriptor: SpotDescriptor;
  candidateSource: BoardCandidateSource;
  options?: Partial<SpotGenerationOptions>;
  rubricThresholdOverrides?: Partial<AdvantageRubricThresholds>;
};

export type AcceptedBoardLibraryEntry = {
  id: string;
  spot: string;
  board: [string, string, string];
  familyTags: BoardFamilyTag[];
  rangeAdvantage: AdvantageLabel;
  nutAdvantage: AdvantageLabel;
  explanation: AdvantageExplanation;
};

export type CandidateBoardReviewEntry = AcceptedBoardLibraryEntry & {
  metrics: {
    heroRawEquity: number | null;
    villainRawEquity: number | null;
    rawEquityEdgePct: number;
    heroOnePairPlus: number;
    villainOnePairPlus: number;
    heroTwoPairPlus: number;
    villainTwoPairPlus: number;
    heroTripsPlus: number;
    villainTripsPlus: number;
    heroStraightPlus: number;
    villainStraightPlus: number;
    heroFlush: number;
    villainFlush: number;
  };
  accepted: boolean;
  rejectionReason?: string;
};

export type SpotGenerationStats = {
  acceptedCount: number;
  rejectedCount: number;
  labelDistribution: Record<AdvantageLabel, number>;
  nutLabelDistribution: Record<AdvantageLabel, number>;
  familyCoverage: BoardFamilyTag[];
  rejectionReasons: Record<string, number>;
};

export type SpotGenerationResult = {
  config: AdvantageSpotConfig;
  accepted: AcceptedBoardLibraryEntry[];
  review: CandidateBoardReviewEntry[];
  stats: SpotGenerationStats;
};

export type SpotLibraryIndexEntry = {
  id: string;
  format: DrillFormat;
  effectiveStackBb: EffectiveStackBb;
  openerPos: RfiPosition;
  callerPos: FacingOpenHeroPosition;
  street: 'flop';
  candidateSourceId: string;
  acceptedFile: string;
  reviewFile: string;
  acceptedCount: number;
  rejectedCount: number;
  familyCoverage: BoardFamilyTag[];
};

const DEFAULT_REQUIRED_FAMILIES: BoardFamilyTag[] = [
  'a-high-dry',
  'k-high-dry',
  'qj-high-dynamic',
  'broadway-connected',
  'middling-connected',
  'low-connected',
  'low-disconnected',
  'paired-high',
  'paired-low',
  'monotone-high',
  'monotone-low',
  'two-tone-dynamic',
];

const DEFAULT_OPTIONS: SpotGenerationOptions = {
  minAccepted: 25,
  maxAccepted: 50,
  maxCloseCloseWithoutCoverage: 4,
  requiredFamilies: DEFAULT_REQUIRED_FAMILIES,
};

const DEFAULT_THRESHOLDS: AdvantageRubricThresholds = {
  clearRangeEdgePct: 3,
  mixedRangeEdgePct: 1.5,
  muddyContradictionEdgePct: 0.05,
  nutDeltaForLead: 0.03,
  bucketLeadThreshold: 0.004,
  weakTopEndDeltaForCloseRange: 0.04,
};

const pct = (value: number) => Number((value * 100).toFixed(2));
const rankValue = (r: string) => 'AKQJT98765432'.indexOf(r);
const suitTexture = (board: FlopBoard) => new Set(board.map((card) => card.suit)).size;

const withDefaults = (config: AdvantageSpotConfig) => ({
  options: { ...DEFAULT_OPTIONS, ...(config.options ?? {}) },
  thresholds: { ...DEFAULT_THRESHOLDS, ...(config.rubricThresholdOverrides ?? {}) },
});

export const classifyBoardFamily = (board: FlopBoard): BoardFamilyTag[] => {
  const sorted = [...board].sort((a, b) => rankValue(a.rank) - rankValue(b.rank));
  const [high, , low] = sorted;
  const paired = new Set(board.map((card) => card.rank)).size < 3;
  const connected = !paired && rankValue(low.rank) - rankValue(high.rank) <= 4;
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

  const dynamicTwoTone =
    texture === 2
    && !paired
    && (connected || (rankValue(low.rank) - rankValue(high.rank) <= 5 && ['A', 'K', 'Q', 'J', 'T', '9'].includes(high.rank)));
  if (dynamicTwoTone) tags.push('two-tone-dynamic');

  return [...new Set(tags)];
};

const topEndProxy = (m: SideMetrics) => m.twoPairPlusShare + m.tripsPlusShare + m.straightPlusShare + m.flushShare;

const parseBoard = (cards: readonly [string, string, string]): FlopBoard => cards.map((card) => parseCard(card)) as FlopBoard;

const analyzeBoard = (
  heroRangeCombos: ReturnType<typeof expandRangeToCombos>,
  villainRangeCombos: ReturnType<typeof expandRangeToCombos>,
  flop: FlopBoard,
): ComparativeAnalysis => {
  const heroLive = filterBlockedCombos(heroRangeCombos, flop);
  const villainLive = filterBlockedCombos(villainRangeCombos, flop);
  const equities = computeRangeVsRangeEquitiesSampled(heroLive, villainLive, flop, {
    heroSamples: 20,
    villainSamples: 20,
    runoutSamples: 45,
  });
  return {
    flop,
    hero: computeRangeMetricsFromCombos(heroLive, flop, { rawEquity: equities.hero }),
    villain: computeRangeMetricsFromCombos(villainLive, flop, { rawEquity: equities.villain }),
  };
};

export const labelRangeAdvantage = (
  analysis: ComparativeAnalysis,
  thresholds: AdvantageRubricThresholds = DEFAULT_THRESHOLDS,
): AdvantageLabel => {
  const edgePct = ((analysis.hero.rawEquity ?? 0) - (analysis.villain.rawEquity ?? 0)) * 100;
  const onePairDelta = analysis.hero.onePairPlusShare - analysis.villain.onePairPlusShare;
  const topEndDelta = topEndProxy(analysis.hero) - topEndProxy(analysis.villain);

  if (edgePct >= thresholds.clearRangeEdgePct) return 'hero';
  if (edgePct <= -thresholds.clearRangeEdgePct) return 'villain';
  if (edgePct >= thresholds.mixedRangeEdgePct && onePairDelta > 0 && topEndDelta > -0.03) return 'hero';
  if (edgePct <= -thresholds.mixedRangeEdgePct && onePairDelta < 0 && topEndDelta < 0.03) return 'villain';
  return 'close';
};

export const labelNutAdvantage = (
  analysis: ComparativeAnalysis,
  thresholds: AdvantageRubricThresholds = DEFAULT_THRESHOLDS,
): AdvantageLabel => {
  const delta = topEndProxy(analysis.hero) - topEndProxy(analysis.villain);
  const buckets = [
    analysis.hero.twoPairPlusShare - analysis.villain.twoPairPlusShare,
    analysis.hero.tripsPlusShare - analysis.villain.tripsPlusShare,
    analysis.hero.straightPlusShare - analysis.villain.straightPlusShare,
    analysis.hero.flushShare - analysis.villain.flushShare,
  ];
  const heroLeads = buckets.filter((v) => v > thresholds.bucketLeadThreshold).length;
  const villainLeads = buckets.filter((v) => v < -thresholds.bucketLeadThreshold).length;
  if (delta >= thresholds.nutDeltaForLead && heroLeads >= 2 && villainLeads <= 1) return 'hero';
  if (delta <= -thresholds.nutDeltaForLead && villainLeads >= 2 && heroLeads <= 1) return 'villain';
  return 'close';
};

export const isMuddyContradiction = (
  analysis: ComparativeAnalysis,
  rangeLabel: AdvantageLabel,
  nutLabel: AdvantageLabel,
  thresholds: AdvantageRubricThresholds = DEFAULT_THRESHOLDS,
): boolean => {
  const equityEdge = Math.abs((analysis.hero.rawEquity ?? 0) - (analysis.villain.rawEquity ?? 0));
  if (rangeLabel !== 'close' && nutLabel !== 'close' && rangeLabel !== nutLabel && equityEdge < thresholds.muddyContradictionEdgePct) {
    return true;
  }
  const topDelta = Math.abs(topEndProxy(analysis.hero) - topEndProxy(analysis.villain));
  return rangeLabel === 'close' && nutLabel !== 'close' && topDelta < thresholds.weakTopEndDeltaForCloseRange;
};

const explanationFor = (analysis: ComparativeAnalysis, rangeLabel: AdvantageLabel, nutLabel: AdvantageLabel): AdvantageExplanation => {
  const rawEq = ((analysis.hero.rawEquity ?? 0) - (analysis.villain.rawEquity ?? 0)) * 100;
  const eqLean = rawEq >= 0 ? 'opener' : 'caller';
  const summary =
    rangeLabel === 'close'
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

const toMetrics = (analysis: ComparativeAnalysis) => ({
  heroRawEquity: analysis.hero.rawEquity,
  villainRawEquity: analysis.villain.rawEquity,
  rawEquityEdgePct: pct((analysis.hero.rawEquity ?? 0) - (analysis.villain.rawEquity ?? 0)),
  heroOnePairPlus: pct(analysis.hero.onePairPlusShare),
  villainOnePairPlus: pct(analysis.villain.onePairPlusShare),
  heroTwoPairPlus: pct(analysis.hero.twoPairPlusShare),
  villainTwoPairPlus: pct(analysis.villain.twoPairPlusShare),
  heroTripsPlus: pct(analysis.hero.tripsPlusShare),
  villainTripsPlus: pct(analysis.villain.tripsPlusShare),
  heroStraightPlus: pct(analysis.hero.straightPlusShare),
  villainStraightPlus: pct(analysis.villain.straightPlusShare),
  heroFlush: pct(analysis.hero.flushShare),
  villainFlush: pct(analysis.villain.flushShare),
});

export const getAnalyzerSpotForDescriptor = (descriptor: SpotDescriptor): AnalyzerSpot => {
  const spot = buildAnalyzerSpots(
    createDefaultData(descriptor.format, descriptor.effectiveStackBb),
    descriptor.format,
    descriptor.effectiveStackBb,
  ).find((entry) => entry.openerPos === descriptor.openerPos && entry.callerPos === descriptor.callerPos);

  if (!spot) {
    throw new Error(`Missing analyzer spot for ${descriptor.format}:${descriptor.effectiveStackBb}:${descriptor.openerPos}:${descriptor.callerPos}:${descriptor.street}`);
  }

  return spot;
};

export const generateSpotLibrary = (config: AdvantageSpotConfig): SpotGenerationResult => {
  const { options, thresholds } = withDefaults(config);
  const spot = getAnalyzerSpotForDescriptor(config.descriptor);
  const heroRangeCombos = expandRangeToCombos(spot.heroRange);
  const villainRangeCombos = expandRangeToCombos(spot.villainRange);
  const accepted: AcceptedBoardLibraryEntry[] = [];
  const review: CandidateBoardReviewEntry[] = [];
  const acceptedByFingerprint = new Set<string>();
  const familyCoverage = new Set<BoardFamilyTag>();
  const rangeCounts: Record<AdvantageLabel, number> = { hero: 0, villain: 0, close: 0 };
  const nutCounts: Record<AdvantageLabel, number> = { hero: 0, villain: 0, close: 0 };
  const rejectionReasons: Record<string, number> = {};
  let closeCloseAccepted = 0;

  config.candidateSource.boards.forEach((boardCards, index) => {
    const analysis = analyzeBoard(heroRangeCombos, villainRangeCombos, parseBoard(boardCards));
    const rangeAdvantage = labelRangeAdvantage(analysis, thresholds);
    const nutAdvantage = labelNutAdvantage(analysis, thresholds);
    rangeCounts[rangeAdvantage] += 1;
    nutCounts[nutAdvantage] += 1;

    const familyTags = classifyBoardFamily(analysis.flop);
    const explanation = explanationFor(analysis, rangeAdvantage, nutAdvantage);
    const board = analysis.flop.map(cardToString) as [string, string, string];
    const id = `${config.id}-flop-${String(index + 1).padStart(3, '0')}`;
    const coverageNeeded = familyTags.some((tag) => options.requiredFamilies.includes(tag) && !familyCoverage.has(tag));

    let acceptedFlag = true;
    let rejectionReason: string | undefined;

    if (accepted.length >= options.maxAccepted) {
      acceptedFlag = false;
      rejectionReason = `Already reached maxAccepted=${options.maxAccepted}.`;
    }

    if (acceptedFlag && familyTags.length === 0) {
      acceptedFlag = false;
      rejectionReason = 'Board did not map cleanly to a target teaching family.';
    }

    if (acceptedFlag && rangeAdvantage === 'close' && nutAdvantage === 'close' && !coverageNeeded && closeCloseAccepted >= options.maxCloseCloseWithoutCoverage) {
      acceptedFlag = false;
      rejectionReason = 'Both range and nut advantage are close without adding missing family coverage.';
    }

    if (acceptedFlag && isMuddyContradiction(analysis, rangeAdvantage, nutAdvantage, thresholds)) {
      acceptedFlag = false;
      rejectionReason = 'Muddy or contradictory metric picture for a first-pass teaching board.';
    }

    const fingerprint = `${familyTags.slice().sort().join('|')}::${rangeAdvantage}::${nutAdvantage}`;
    if (acceptedFlag && acceptedByFingerprint.has(fingerprint) && !coverageNeeded) {
      acceptedFlag = false;
      rejectionReason = 'Redundant board texture and teaching point already represented.';
    }

    if (acceptedFlag) {
      acceptedByFingerprint.add(fingerprint);
      familyTags.forEach((tag) => familyCoverage.add(tag));
      accepted.push({ id, spot: config.id, board, familyTags, rangeAdvantage, nutAdvantage, explanation });
      if (rangeAdvantage === 'close' && nutAdvantage === 'close') closeCloseAccepted += 1;
    }

    if (!acceptedFlag && rejectionReason) {
      rejectionReasons[rejectionReason] = (rejectionReasons[rejectionReason] ?? 0) + 1;
    }

    review.push({
      id,
      spot: config.id,
      board,
      familyTags,
      rangeAdvantage,
      nutAdvantage,
      explanation,
      metrics: toMetrics(analysis),
      accepted: acceptedFlag,
      rejectionReason,
    });
  });

  if (accepted.length < options.minAccepted) {
    throw new Error(`Spot ${config.id} produced ${accepted.length} accepted boards; expected at least ${options.minAccepted}.`);
  }

  return {
    config,
    accepted,
    review,
    stats: {
      acceptedCount: accepted.length,
      rejectedCount: review.length - accepted.length,
      labelDistribution: rangeCounts,
      nutLabelDistribution: nutCounts,
      familyCoverage: [...familyCoverage].sort(),
      rejectionReasons,
    },
  };
};

export const generateAllSpotLibraries = (configs: readonly AdvantageSpotConfig[]): SpotGenerationResult[] =>
  configs.map((config) => generateSpotLibrary(config));

export const buildSpotLibraryIndex = (results: readonly SpotGenerationResult[]): SpotLibraryIndexEntry[] =>
  results
    .map((result) => ({
      id: result.config.id,
      format: result.config.descriptor.format,
      effectiveStackBb: result.config.descriptor.effectiveStackBb,
      openerPos: result.config.descriptor.openerPos,
      callerPos: result.config.descriptor.callerPos,
      street: result.config.descriptor.street,
      candidateSourceId: result.config.candidateSource.id,
      acceptedFile: `${result.config.id}.accepted.json`,
      reviewFile: `${result.config.id}.review.json`,
      acceptedCount: result.stats.acceptedCount,
      rejectedCount: result.stats.rejectedCount,
      familyCoverage: result.stats.familyCoverage,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

// backward-compatible helper for existing tests/callers
export const generateBtnVsBbFlopAdvantageLibrary = () => {
  const result = generateSpotLibrary(getAdvantageSpotConfigById('cash9max-100-btn-vs-bb-srp-flop'));
  return { accepted: result.accepted, review: result.review, coverage: result.stats.familyCoverage };
};
