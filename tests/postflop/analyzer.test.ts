import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultData } from '../../src/domain/storage/defaultData.ts';
import { filterBlockedCombos } from '../../src/domain/postflop-analysis/blockers.ts';
import { expandHandClassToCombos, expandRangeToCombos } from '../../src/domain/postflop-analysis/comboExpansion.ts';
import { compareRangesOnFlop } from '../../src/domain/postflop-analysis/compareRanges.ts';
import { parseCard } from '../../src/domain/postflop/cards.ts';
import { computeRangeMetrics } from '../../src/domain/postflop-analysis/rangeMetrics.ts';
import { buildAnalysisSummary } from '../../src/domain/postflop-analysis/summaries.ts';
import { validateFlopSelection } from '../../src/domain/postflop-analysis/flopSelection.ts';
import { buildAnalyzerSpots } from '../../src/domain/postflop-analysis/catalog.ts';
import { loadData } from '../../src/lib/storage.ts';

const c = parseCard;

test('combo expansion: pocket pairs, suited, offsuit, and mixed ranges', () => {
  assert.equal(expandHandClassToCombos('AA').length, 6);
  assert.equal(expandHandClassToCombos('AKs').length, 4);
  assert.equal(expandHandClassToCombos('AKo').length, 12);

  const mixed = expandRangeToCombos(['AA', 'AKs', 'AKo']);
  assert.equal(mixed.length, 22);
  assert.equal(new Set(mixed.map((combo) => combo.id)).size, mixed.length);
});

test('blockers remove exact blocked combos', () => {
  const combos = expandHandClassToCombos('AKs');
  const flop = [c('As'), c('Kd'), c('2c')] as const;
  const filtered = filterBlockedCombos(combos, flop);
  assert.equal(filtered.length, 2);
  assert.equal(filtered.some((combo) => combo.id.includes('As')), false);
  assert.equal(filtered.some((combo) => combo.id.includes('Kd')), false);
});

test('analysis densities: made-hand and draw metrics on inspectable fixtures', () => {
  const onePairPlus = computeRangeMetrics(['AA'], [c('As'), c('Kd'), c('2c')]);
  assert.equal(onePairPlus.comboCount, 3);
  assert.equal(onePairPlus.onePairPlusShare, 1);
  assert.equal(onePairPlus.twoPairPlusShare, 1);
  assert.equal(onePairPlus.tripsPlusShare, 1);

  const openEnded = computeRangeMetrics(['87o'], [c('6d'), c('5s'), c('Kc')]);
  assert.equal(openEnded.openEndedShare, 1);

  const gutshot = computeRangeMetrics(['A5o'], [c('4d'), c('3s'), c('Kc')]);
  assert.equal(gutshot.gutshotShare, 1);

  const wheelEdge = computeRangeMetrics(['A2o'], [c('4d'), c('3s'), c('Kc')]);
  assert.equal(wheelEdge.openEndedShare, 0);
  assert.equal(wheelEdge.gutshotShare, 1);

  const broadwayEdge = computeRangeMetrics(['AKo'], [c('Qd'), c('Js'), c('9c')]);
  assert.equal(broadwayEdge.openEndedShare, 0);
  assert.equal(broadwayEdge.gutshotShare, 1);

  const flushDraw = computeRangeMetrics(['AKs'], [c('2h'), c('7h'), c('3d')]);
  assert.equal(flushDraw.flushDrawShare, 0.25);

  const flush = computeRangeMetrics(['A2s'], [c('Kh'), c('Qh'), c('3h')]);
  assert.equal(flush.flushShare, 0.25);
});

test('summary heuristics handle close and clear edges stably', () => {
  const close = buildAnalysisSummary(
    {
      comboCount: 10,
      rawEquity: null,
      onePairPlusShare: 0.4,
      twoPairPlusShare: 0.2,
      tripsPlusShare: 0.1,
      straightPlusShare: 0.05,
      flushShare: 0,
      flushDrawShare: 0,
      openEndedShare: 0,
      gutshotShare: 0,
    },
    {
      comboCount: 10,
      rawEquity: null,
      onePairPlusShare: 0.41,
      twoPairPlusShare: 0.2,
      tripsPlusShare: 0.1,
      straightPlusShare: 0.05,
      flushShare: 0,
      flushDrawShare: 0,
      openEndedShare: 0,
      gutshotShare: 0,
    },
  );
  assert.equal(close.rawEquityEdge, 'Close');

  const topEnd = buildAnalysisSummary(
    {
      comboCount: 10,
      rawEquity: null,
      onePairPlusShare: 0.45,
      twoPairPlusShare: 0.4,
      tripsPlusShare: 0.3,
      straightPlusShare: 0.25,
      flushShare: 0.15,
      flushDrawShare: 0,
      openEndedShare: 0,
      gutshotShare: 0,
    },
    {
      comboCount: 10,
      rawEquity: null,
      onePairPlusShare: 0.45,
      twoPairPlusShare: 0.15,
      tripsPlusShare: 0.05,
      straightPlusShare: 0.01,
      flushShare: 0,
      flushDrawShare: 0,
      openEndedShare: 0,
      gutshotShare: 0,
    },
  );
  assert.equal(topEnd.topEndEdge, 'Hero');
});

test('invalid flop selections are rejected', () => {
  assert.equal(validateFlopSelection(['As', 'As', 'Kd']).ok, false);
  assert.equal(validateFlopSelection(['As', '', 'Kd']).ok, false);
  assert.equal(validateFlopSelection(['As', 'Kh', 'Qd']).ok, true);
});

test('analyzer uses pure analysis and does not mutate drill stats', () => {
  const data = createDefaultData();
  const before = structuredClone(data.stats);
  const spots = buildAnalyzerSpots(data, 'cash9max', 100);
  assert.ok(spots.length > 0);

  const spot = spots[0];
  const resultOne = compareRangesOnFlop(spot.heroRange, spot.villainRange, [c('As'), c('Kd'), c('2c')]);
  const resultTwo = compareRangesOnFlop(spot.heroRange, spot.villainRange, [c('7s'), c('6d'), c('5c')]);

  assert.notDeepEqual(resultOne.hero.onePairPlusShare, resultTwo.hero.onePairPlusShare);
  assert.deepEqual(data.stats, before);
});

test('persistence migration restores analyzer state safely', () => {
  const store = new Map<string, string>();
  const localStorageMock = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };

  (globalThis as { localStorage?: unknown }).localStorage = localStorageMock;

  const legacyData = createDefaultData();
  delete (legacyData.settings as Record<string, unknown>).analyzer;
  localStorageMock.setItem('poker_range_drill_v2', JSON.stringify(legacyData));

  const loadedData = loadData();
  assert.equal(loadedData.settings.analyzer.spotId, null);
  assert.equal(loadedData.settings.analyzer.flop, null);
  assert.equal(loadedData.stats.byDrill.rfi.attempts, 0);
});

test('persistence migration sanitizes malformed analyzer fields', () => {
  const store = new Map<string, string>();
  const localStorageMock = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };

  (globalThis as { localStorage?: unknown }).localStorage = localStorageMock;

  const malformed = createDefaultData();
  (malformed.settings as Record<string, unknown>).analyzer = {
    format: 'bad-format',
    effectiveStackBb: 'not-a-number',
    spotId: { weird: true },
    flop: [1, 2, 3],
  };
  localStorageMock.setItem('poker_range_drill_v2', JSON.stringify(malformed));

  const loaded = loadData();
  assert.equal(loaded.settings.analyzer.format, 'cash9max');
  assert.equal(loaded.settings.analyzer.effectiveStackBb, 100);
  assert.equal(loaded.settings.analyzer.spotId, null);
  assert.equal(loaded.settings.analyzer.flop, null);
});
