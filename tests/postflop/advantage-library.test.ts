import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSpotLibraryIndex,
  generateAllSpotLibraries,
  generateBtnVsBbFlopAdvantageLibrary,
  generateSpotLibrary,
  isMuddyContradiction,
  labelNutAdvantage,
  labelRangeAdvantage,
} from '../../src/domain/postflop-analysis/advantageLibrary.ts';
import { ADVANTAGE_SPOT_CONFIGS, getAdvantageSpotConfigById } from '../../src/domain/postflop-analysis/advantageLibrarySpots.ts';
import type { ComparativeAnalysis } from '../../src/domain/postflop-analysis/types.ts';
import { parseCard } from '../../src/domain/postflop/cards.ts';

const c = parseCard;

const makeAnalysis = (overrides: Partial<ComparativeAnalysis> = {}): ComparativeAnalysis => ({
  flop: [c('As'), c('8d'), c('3c')],
  hero: {
    comboCount: 100,
    onePairPlusShare: 0.45,
    twoPairPlusShare: 0.12,
    tripsPlusShare: 0.04,
    straightPlusShare: 0.02,
    flushShare: 0.01,
    flushDrawShare: 0.1,
    openEndedShare: 0.08,
    gutshotShare: 0.1,
    rawEquity: 0.52,
  },
  villain: {
    comboCount: 100,
    onePairPlusShare: 0.42,
    twoPairPlusShare: 0.1,
    tripsPlusShare: 0.03,
    straightPlusShare: 0.02,
    flushShare: 0.01,
    flushDrawShare: 0.1,
    openEndedShare: 0.08,
    gutshotShare: 0.1,
    rawEquity: 0.48,
  },
  ...overrides,
});

test('spot config resolver resolves known id and throws for unknown id', () => {
  const config = getAdvantageSpotConfigById('cash9max-100-btn-vs-bb-srp-flop');
  assert.equal(config.descriptor.openerPos, 'BTN');
  assert.equal(config.descriptor.callerPos, 'BB');
  assert.throws(() => getAdvantageSpotConfigById('unknown-spot'));
});

test('range advantage rubric: hero large edge, villain large edge, and mixed close', () => {
  const heroClear = makeAnalysis();
  const villainClear = makeAnalysis({
    hero: { ...makeAnalysis().hero, rawEquity: 0.45, onePairPlusShare: 0.4 },
    villain: { ...makeAnalysis().villain, rawEquity: 0.55, onePairPlusShare: 0.47 },
  });
  const mixedClose = makeAnalysis({
    hero: { ...makeAnalysis().hero, rawEquity: 0.507, onePairPlusShare: 0.43 },
    villain: { ...makeAnalysis().villain, rawEquity: 0.493, onePairPlusShare: 0.44, twoPairPlusShare: 0.14 },
  });

  assert.equal(labelRangeAdvantage(heroClear), 'hero');
  assert.equal(labelRangeAdvantage(villainClear), 'villain');
  assert.equal(labelRangeAdvantage(mixedClose), 'close');
});

test('nut advantage rubric: clear top-end lead vs muddy top-end picture', () => {
  const heroNuts = makeAnalysis({
    hero: { ...makeAnalysis().hero, twoPairPlusShare: 0.16, tripsPlusShare: 0.07, straightPlusShare: 0.04, flushShare: 0.03 },
    villain: { ...makeAnalysis().villain, twoPairPlusShare: 0.08, tripsPlusShare: 0.02, straightPlusShare: 0.02, flushShare: 0.01 },
  });
  const muddy = makeAnalysis({
    hero: { ...makeAnalysis().hero, twoPairPlusShare: 0.12, tripsPlusShare: 0.02, straightPlusShare: 0.05, flushShare: 0.01 },
    villain: { ...makeAnalysis().villain, twoPairPlusShare: 0.11, tripsPlusShare: 0.05, straightPlusShare: 0.01, flushShare: 0.03 },
  });

  assert.equal(labelNutAdvantage(heroNuts), 'hero');
  assert.equal(labelNutAdvantage(muddy), 'close');
});

test('rejection helper: contradictory and muddy pictures are flagged', () => {
  const contradictory = makeAnalysis({
    hero: { ...makeAnalysis().hero, rawEquity: 0.524, twoPairPlusShare: 0.06, tripsPlusShare: 0.01, straightPlusShare: 0.01, flushShare: 0 },
    villain: { ...makeAnalysis().villain, rawEquity: 0.476, twoPairPlusShare: 0.17, tripsPlusShare: 0.08, straightPlusShare: 0.05, flushShare: 0.01 },
  });
  assert.equal(isMuddyContradiction(contradictory, 'hero', 'villain'), true);

  const closeRangeWeakNut = makeAnalysis({
    hero: { ...makeAnalysis().hero, rawEquity: 0.502, twoPairPlusShare: 0.11, tripsPlusShare: 0.03, straightPlusShare: 0.02, flushShare: 0.01 },
    villain: { ...makeAnalysis().villain, rawEquity: 0.498, twoPairPlusShare: 0.09, tripsPlusShare: 0.03, straightPlusShare: 0.02, flushShare: 0.01 },
  });
  assert.equal(isMuddyContradiction(closeRangeWeakNut, 'close', 'hero'), true);
});

test('legacy helper still generates BTN vs BB without requiring config input', () => {
  const { accepted, review, coverage } = generateBtnVsBbFlopAdvantageLibrary();
  assert.ok(accepted.length >= 25);
  assert.ok(review.length > accepted.length);
  assert.ok(coverage.length > 0);
});

test('multi-spot generation is deterministic and stats include labels/families/rejections', () => {
  const runA = generateAllSpotLibraries(ADVANTAGE_SPOT_CONFIGS);
  const runB = generateAllSpotLibraries(ADVANTAGE_SPOT_CONFIGS);

  assert.equal(runA.length >= 2, true);
  assert.deepEqual(
    runA.map((result) => result.accepted.map((entry) => entry.id)),
    runB.map((result) => result.accepted.map((entry) => entry.id)),
  );

  runA.forEach((result) => {
    assert.equal(result.accepted.length >= 25, true);
    assert.equal(result.review.length > result.accepted.length, true);
    assert.deepEqual([...result.stats.familyCoverage].sort(), result.stats.familyCoverage);
    assert.equal(result.stats.acceptedCount, result.accepted.length);
    assert.equal(result.stats.rejectedCount, result.review.length - result.accepted.length);
    assert.equal(typeof result.stats.labelDistribution.hero, 'number');
    assert.equal(typeof result.stats.nutLabelDistribution.villain, 'number');
  });
});

test('index builder returns sorted, contract-stable entries for all spots', () => {
  const results = generateAllSpotLibraries(ADVANTAGE_SPOT_CONFIGS);
  const index = buildSpotLibraryIndex(results);

  assert.equal(index.length, results.length);
  assert.deepEqual(index.map((entry) => entry.id), [...index.map((entry) => entry.id)].sort());
  index.forEach((entry) => {
    assert.ok(entry.acceptedFile.endsWith('.accepted.json'));
    assert.ok(entry.reviewFile.endsWith('.review.json'));
    assert.equal(typeof entry.acceptedCount, 'number');
    assert.equal(typeof entry.rejectedCount, 'number');
    assert.equal(Array.isArray(entry.familyCoverage), true);
  });
});

test('single-spot generation has expected output contract and no hardcoded spot literal', () => {
  const spot = getAdvantageSpotConfigById('cash9max-100-co-vs-bb-srp-flop');
  const result = generateSpotLibrary(spot);

  assert.ok(result.accepted.every((entry) => entry.spot === spot.id));
  assert.ok(result.review.every((entry) => entry.spot === spot.id));
  assert.ok(result.accepted.every((entry) => entry.id.startsWith(`${spot.id}-flop-`)));
  assert.ok(result.review.some((entry) => entry.rejectionReason));
});
