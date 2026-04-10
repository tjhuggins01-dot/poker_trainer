import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultData } from '../../src/domain/storage/defaultData.ts';
import { filterBlockedCombos, filterBlockedCombosByCards } from '../../src/domain/postflop-analysis/blockers.ts';
import { expandHandClassToCombos, expandRangeToCombos } from '../../src/domain/postflop-analysis/comboExpansion.ts';
import { compareRangesOnFlop } from '../../src/domain/postflop-analysis/compareRanges.ts';
import { parseCard } from '../../src/domain/postflop/cards.ts';
import { computeRangeMetrics } from '../../src/domain/postflop-analysis/rangeMetrics.ts';
import { buildAnalysisSummary } from '../../src/domain/postflop-analysis/summaries.ts';
import { validateExactHandSelection, validateFlopSelection } from '../../src/domain/postflop-analysis/flopSelection.ts';
import { loadData } from '../../src/lib/storage.ts';
import { analyzeHandVsRange } from '../../src/domain/postflop-analysis/analyzeHandVsRange.ts';
import { computeHandVsHandEquity, computeHandVsRangeEquity, computeRangeVsRangeEquities } from '../../src/domain/postflop-analysis/equity.ts';
import { SIMPLIFIED_BOARD_PRESETS, flopMatchesPreset, generateFlopFromPreset } from '../../src/domain/postflop-analysis/simplifiedBoards.ts';
import { buildAnalyzerSpots, parseAnalyzerSpotId } from '../../src/domain/postflop-analysis/catalog.ts';
import type { Combo } from '../../src/domain/postflop-analysis/types.ts';

const c = parseCard;

const close = (actual: number, expected: number, epsilon = 1e-9) => {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${actual} to be within ${epsilon} of ${expected}`);
};

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
  const closeSummary = buildAnalysisSummary(
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
  assert.equal(closeSummary.rawEquityEdge, 'Close');

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

test('exact hand selection and blockers are validated', () => {
  assert.equal(validateExactHandSelection(['As', 'As']).ok, false);
  assert.equal(validateExactHandSelection(['As', 'Kd'], [c('As'), c('Kh'), c('2d')]).ok, false);

  const legal = validateExactHandSelection(['Ac', 'Kd'], [c('As'), c('Kh'), c('2d')]);
  assert.equal(legal.ok, true);

  const blockedRange = filterBlockedCombosByCards(expandHandClassToCombos('AKo'), [c('Ac'), c('Kd')]);
  assert.equal(blockedRange.some((combo) => combo.id.includes('Ac')), false);
  assert.equal(blockedRange.some((combo) => combo.id.includes('Kd')), false);
});

test('simplified board presets generate legal and matching flops', () => {
  SIMPLIFIED_BOARD_PRESETS.forEach((preset) => {
    const flop = generateFlopFromPreset(preset.id);
    assert.equal(new Set(flop.map((card) => `${card.rank}${card.suit}`)).size, 3);
    assert.equal(flopMatchesPreset(flop, preset), true, `preset mismatch: ${preset.id}`);
  });
});

test('raw equity: hand vs hand, tie, and dominance sanity checks', () => {
  const tieEq = computeHandVsHandEquity([c('As'), c('Ad')], [c('Ah'), c('Ac')], [c('2s'), c('7d'), c('9c')]);
  close(tieEq, 0.5, 1e-12);

  const nutsVsAir = computeHandVsHandEquity([c('As'), c('Ah')], [c('2s'), c('3d')], [c('Ac'), c('Kd'), c('Qh')]);
  assert.ok(nutsVsAir > 0.95);
});

test('raw equity: hand vs range and exact-combo weighting are used', () => {
  const flop = [c('2c'), c('7d'), c('9h')] as const;
  const hero = [c('As'), c('Ad')] as const;
  const villainCombos = filterBlockedCombosByCards(expandRangeToCombos(['AKs', 'AQs']), [...flop, ...hero]);
  const hvRange = computeHandVsRangeEquity(hero, villainCombos, flop);
  assert.ok(hvRange != null);

  const manual = villainCombos.reduce((sum, combo) => sum + computeHandVsHandEquity(hero, combo.hole, flop), 0) / villainCombos.length;
  close(hvRange!, manual, 1e-12);
});


test('equity helpers defensively ignore combos blocked by flop cards', () => {
  const flop = [c('As'), c('Kd'), c('2c')] as const;
  const hero = [c('Qh'), c('Qd')] as const;

  const blockedVillain: Combo[] = [{ id: 'AsKh', handClass: 'AKs', hole: [c('As'), c('Kh')] }];
  const hv = computeHandVsRangeEquity(hero, blockedVillain, flop);
  assert.equal(hv, null);

  const rv = computeRangeVsRangeEquities(
    [{ id: 'AsQh', handClass: 'AQs', hole: [c('As'), c('Qh')] }],
    [{ id: 'KhQc', handClass: 'KQo', hole: [c('Kh'), c('Qc')] }],
    flop,
  );
  assert.equal(rv.hero, null);
  assert.equal(rv.villain, null);
});

test('raw equity: range vs range returns real values and blocker sensitivity', () => {
  const flop = [c('As'), c('Kd'), c('2c')] as const;
  const analysis = compareRangesOnFlop(['AA', 'AKs'], ['22', 'KQs'], flop);
  assert.ok(analysis.hero.rawEquity != null);
  assert.ok(analysis.villain.rawEquity != null);
  close((analysis.hero.rawEquity ?? 0) + (analysis.villain.rawEquity ?? 0), 1, 1e-9);

  const equities = computeRangeVsRangeEquities(
    filterBlockedCombos(expandRangeToCombos(['AA']), flop),
    filterBlockedCombos(expandRangeToCombos(['KK']), flop),
    flop,
  );
  assert.ok((equities.hero ?? 0) > 0.85);
});

test('analysis supports metrics-only mode without running equity', () => {
  const flop = [c('As'), c('Kd'), c('2c')] as const;
  const rangeOnly = compareRangesOnFlop(['AA', 'AKs'], ['QQ', 'KQs'], flop, { includeEquity: false });
  assert.equal(rangeOnly.hero.rawEquity, null);
  assert.equal(rangeOnly.villain.rawEquity, null);
  assert.ok(rangeOnly.hero.comboCount > 0);

  const handOnly = analyzeHandVsRange([c('Ac'), c('Qd')], ['AQo', 'KQo', '77'], flop, { includeEquity: false });
  assert.equal(handOnly.hand.rawEquity, null);
  assert.equal(handOnly.range.rawEquity, null);
  assert.ok(handOnly.notes.some((note) => note.includes('Calc equity')));
});

test('hand vs range analysis returns hand + range metrics on flop', () => {
  const result = analyzeHandVsRange(
    [c('As'), c('Kd')],
    ['AQo', 'KQo', '77'],
    [c('Ah'), c('7d'), c('2c')],
  );

  assert.equal(result.hand.category, 'one-pair');
  assert.ok(result.range.comboCount > 0);
  assert.ok(result.hand.rawEquity != null);
});

test('analyzer uses pure analysis and does not mutate drill stats', () => {
  const data = createDefaultData();
  const before = structuredClone(data.stats);

  const resultOne = compareRangesOnFlop(['AA', 'AKs'], ['QQ', 'KQs'], [c('As'), c('Kd'), c('2c')]);
  const resultTwo = compareRangesOnFlop(['AA', 'AKs'], ['QQ', 'KQs'], [c('7s'), c('6d'), c('5c')]);

  assert.notDeepEqual(resultOne.hero.onePairPlusShare, resultTwo.hero.onePairPlusShare);
  assert.deepEqual(data.stats, before);
});

test('analyzer spots expand beyond BB and exclude missing matchups safely', () => {
  const data = createDefaultData();
  const spots = buildAnalyzerSpots(data, 'cash9max', 100);
  assert.ok(spots.length > 0);
  assert.ok(spots.some((spot) => spot.callerPos === 'BB'));
  assert.ok(spots.some((spot) => spot.callerPos !== 'BB'));
  assert.ok(spots.some((spot) => spot.openerPos === 'UTG' && spot.callerPos === 'UTG1'));

  const firstNonBb = spots.find((spot) => spot.callerPos !== 'BB');
  assert.ok(firstNonBb);
  if (!firstNonBb) return;

  const pruned = structuredClone(data);
  delete pruned.situations[`FACING_OPEN_cash9max_100BB_${firstNonBb.callerPos}_VS_${firstNonBb.openerPos}`];
  const prunedSpots = buildAnalyzerSpots(pruned, 'cash9max', 100);
  assert.equal(prunedSpots.some((spot) => spot.id === firstNonBb.id), false);

  const emptied = structuredClone(data);
  const key = `FACING_OPEN_cash9max_100BB_${firstNonBb.callerPos}_VS_${firstNonBb.openerPos}`;
  const record = emptied.situations[key];
  if (record && record.drillType === 'facing_open') {
    record.policy.call = [];
  }
  const emptiedSpots = buildAnalyzerSpots(emptied, 'cash9max', 100);
  assert.equal(emptiedSpots.some((spot) => spot.id === firstNonBb.id), false);
});

test('analyzer spot id parsing only accepts supported opener/caller pairs', () => {
  assert.deepEqual(parseAnalyzerSpotId('cash9max:100:UTG:CO:srp'), { openerPos: 'UTG', callerPos: 'CO' });
  assert.equal(parseAnalyzerSpotId('cash9max:100:UTG:CO:not-srp'), null);
  assert.equal(parseAnalyzerSpotId('cash9max:100:BB:CO:srp'), null);
  assert.equal(parseAnalyzerSpotId('cash9max:100:UTG:UTG:srp'), null);
  assert.equal(parseAnalyzerSpotId('cash9max:100:UTG:CO'), null);
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
  assert.equal(loadedData.settings.analyzer.openerPos, null);
  assert.equal(loadedData.settings.analyzer.callerPos, null);
  assert.equal(loadedData.settings.analyzer.flop, null);
  assert.equal(loadedData.settings.analyzer.mode, 'range-vs-range');
  assert.equal(loadedData.settings.analyzer.boardInputMode, 'exact');
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
    spotId: 'cash9max:100:UTG:CO:srp',
    openerPos: 'bad-opener',
    callerPos: 'bad-caller',
    mode: 'bad-mode',
    boardInputMode: 'bad-board-mode',
    simplifiedPresetId: 3,
    exactHand: ['As', 3],
    flop: [1, 2, 3],
  };
  localStorageMock.setItem('poker_range_drill_v2', JSON.stringify(malformed));

  const loaded = loadData();
  assert.equal(loaded.settings.analyzer.format, 'cash9max');
  assert.equal(loaded.settings.analyzer.effectiveStackBb, 100);
  assert.equal(loaded.settings.analyzer.spotId, 'cash9max:100:UTG:CO:srp');
  assert.equal(loaded.settings.analyzer.openerPos, 'UTG');
  assert.equal(loaded.settings.analyzer.callerPos, 'CO');
  assert.equal(loaded.settings.analyzer.mode, 'range-vs-range');
  assert.equal(loaded.settings.analyzer.boardInputMode, 'exact');
  assert.equal(loaded.settings.analyzer.simplifiedPresetId, null);
  assert.equal(loaded.settings.analyzer.exactHand, null);
  assert.equal(loaded.settings.analyzer.flop, null);
});
