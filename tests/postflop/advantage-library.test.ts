import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateBtnVsBbFlopAdvantageLibrary,
  isMuddyContradiction,
  labelNutAdvantage,
  labelRangeAdvantage,
} from '../../src/domain/postflop-analysis/advantageLibrary.ts';
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

test('library generation structure, uniqueness, coverage, legality, and rejection reasons', () => {
  const { accepted, review, coverage } = generateBtnVsBbFlopAdvantageLibrary();

  assert.ok(accepted.length >= 25 && accepted.length <= 50);
  assert.equal(review.length > accepted.length, true);
  assert.equal(new Set(accepted.map((entry) => entry.board.join(''))).size, accepted.length);

  accepted.forEach((entry) => {
    assert.equal(entry.spot, 'cash9max-100-btn-vs-bb-srp-flop');
    assert.equal(new Set(entry.board).size, 3);
    assert.ok(entry.familyTags.length > 0);
    assert.ok(entry.explanation.summary.length > 0);
    assert.ok(entry.explanation.tags.length > 0);
  });

  const requiredFamilies = [
    'a-high-dry', 'k-high-dry', 'qj-high-dynamic', 'broadway-connected', 'middling-connected', 'low-connected',
    'low-disconnected', 'paired-high', 'paired-low', 'monotone-high', 'monotone-low', 'two-tone-dynamic',
  ];
  requiredFamilies.forEach((family) => assert.ok(coverage.includes(family as typeof coverage[number])));

  review.filter((entry) => !entry.accepted).forEach((entry) => {
    assert.ok(entry.rejectionReason && entry.rejectionReason.length > 0);
    assert.ok(entry.metrics.heroRawEquity != null || entry.metrics.villainRawEquity != null);
  });
});
