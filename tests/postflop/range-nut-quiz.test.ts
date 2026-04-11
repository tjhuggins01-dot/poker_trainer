import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultData, createDefaultSession } from '../../src/domain/storage/defaultData.ts';
import {
  evaluateRangeNutQuizSelection,
  getEnabledRangeNutQuizSpots,
  getRangeNutQuizEntriesForSpot,
  getRangeNutQuizSpotCatalog,
  nextPromptIndex,
  RANGE_NUT_MVP_SPOT_ID,
} from '../../src/domain/postflop/rangeNutAdvantageQuiz.ts';
import { reduceDataOnRangeNutAnswer, reduceSessionOnRangeNutAnswer } from '../../src/domain/postflop/rangeNutAdvantageStats.ts';

test('content loading: catalog registers MVP spot and prompt shape is valid', () => {
  const catalog = getRangeNutQuizSpotCatalog();
  const enabled = getEnabledRangeNutQuizSpots();
  assert.ok(catalog.some((spot) => spot.id === RANGE_NUT_MVP_SPOT_ID));
  assert.equal(enabled.length, 1);
  assert.equal(enabled[0].id, RANGE_NUT_MVP_SPOT_ID);

  const entries = getRangeNutQuizEntriesForSpot(RANGE_NUT_MVP_SPOT_ID);
  assert.ok(entries.length > 0);
  const sample = entries[0];
  assert.equal(sample.board.length, 3);
  assert.equal(typeof sample.explanation.summary, 'string');
  assert.equal(Array.isArray(sample.explanation.tags), true);
});

test('scoring: correct, mixed, and fully-correct evaluation paths are handled', () => {
  const [entry] = getRangeNutQuizEntriesForSpot(RANGE_NUT_MVP_SPOT_ID);
  const fullyCorrect = evaluateRangeNutQuizSelection(entry, {
    rangeAdvantage: entry.rangeAdvantage,
    nutAdvantage: entry.nutAdvantage,
  });
  assert.equal(fullyCorrect.rangeCorrect, true);
  assert.equal(fullyCorrect.nutCorrect, true);
  assert.equal(fullyCorrect.fullyCorrect, true);

  const mixed = evaluateRangeNutQuizSelection(entry, {
    rangeAdvantage: entry.rangeAdvantage,
    nutAdvantage: entry.nutAdvantage === 'hero' ? 'villain' : 'hero',
  });
  assert.equal(mixed.rangeCorrect, true);
  assert.equal(mixed.nutCorrect, false);
  assert.equal(mixed.fullyCorrect, false);
});

test('stats: range/nut quiz updates are drill-scoped and analyzer-independent', () => {
  const data = createDefaultData();
  const session = createDefaultSession();
  const [entry] = getRangeNutQuizEntriesForSpot(RANGE_NUT_MVP_SPOT_ID);
  const evalResult = evaluateRangeNutQuizSelection(entry, {
    rangeAdvantage: entry.rangeAdvantage,
    nutAdvantage: entry.nutAdvantage === 'hero' ? 'villain' : 'hero',
  });

  const nextSession = reduceSessionOnRangeNutAnswer(session, evalResult, 1200);
  const nextData = reduceDataOnRangeNutAnswer(data, entry, evalResult, 1200);

  assert.equal(nextSession.byDrill.postflop_range_nut_advantage.attempts, 1);
  assert.equal(nextSession.byDrill.postflop_hand_category.attempts, 0);
  assert.equal(nextData.stats.byDrill.postflop_range_nut_advantage.attempts, 1);
  assert.equal(nextData.stats.byDrill.facing_open.attempts, 0);
  assert.equal(nextData.settings.analyzer.mode, data.settings.analyzer.mode);
  assert.equal(nextData.stats.postflop.rangeNutAdvantage.rangeCorrect, 1);
  assert.equal(nextData.stats.postflop.rangeNutAdvantage.nutCorrect, 0);
});

test('ui flow helpers: next prompt cycling remains stable for future spot expansion', () => {
  assert.equal(nextPromptIndex(0, 29), 1);
  assert.equal(nextPromptIndex(28, 29), 0);
  assert.equal(nextPromptIndex(0, 0), 0);
});
