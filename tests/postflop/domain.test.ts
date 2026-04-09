import test from 'node:test';
import assert from 'node:assert/strict';
import { cardToString, parseCard } from '../../src/domain/postflop/cards.ts';
import { validateUniqueCards } from '../../src/domain/postflop/board.ts';
import { evaluateFlopHandCategory, evaluateHandCategory } from '../../src/domain/postflop/evaluate.ts';
import { detectDrawCategory } from '../../src/domain/postflop/draws.ts';
import { generateHandCategorySequencePrompt } from '../../src/domain/postflop/generators.ts';
import { createSequenceSeedGenerator } from '../../src/domain/postflop/seeding.ts';
import { nextStreet, shouldShowStreetFeedback } from '../../src/domain/postflop/sessionFlow.ts';
import { createDefaultData, createDefaultSession } from '../../src/domain/storage/defaultData.ts';
import { reduceAppDataStatsOnAnswer, reduceSessionOnAnswer } from '../../src/domain/stats/reducers.ts';
import { loadData, loadSession } from '../../src/lib/storage.ts';

const c = parseCard;

test('card parsing and serialization', () => {
  assert.deepEqual(c('Ah'), { rank: 'A', suit: 'h' });
  assert.equal(cardToString(c('Td')), 'Td');
  assert.throws(() => c('1x'));
  assert.throws(() => c('AAA'));
});

test('duplicate validation', () => {
  assert.equal(validateUniqueCards([c('Ah'), c('Kd'), c('Qs'), c('Jc'), c('9h')]), true);
  assert.equal(validateUniqueCards([c('Ah'), c('Ah')]), false);
});

test('taxonomy: trips covers former set/trips spots', () => {
  assert.equal(evaluateFlopHandCategory([c('Ah'), c('Ac')], [c('Ad'), c('7s'), c('3h')]).category, 'trips');
  assert.equal(evaluateFlopHandCategory([c('Ah'), c('7c')], [c('Ad'), c('As'), c('3h')]).category, 'trips');
});

test('straight flush and precedence ordering', () => {
  assert.equal(evaluateFlopHandCategory([c('9h'), c('8h')], [c('7h'), c('6h'), c('5h')]).category, 'straight-flush');
  assert.equal(evaluateFlopHandCategory([c('Ah'), c('Ac')], [c('Ad'), c('As'), c('3h')]).category, 'quads');
  assert.equal(evaluateFlopHandCategory([c('Kh'), c('Kc')], [c('Kd'), c('3s'), c('3h')]).category, 'full-house');
  assert.equal(evaluateFlopHandCategory([c('9h'), c('8h')], [c('7h'), c('2h'), c('3h')]).category, 'flush');
  assert.equal(evaluateFlopHandCategory([c('8h'), c('7c')], [c('6d'), c('5s'), c('4h')]).category, 'straight');
});

test('draw detection obvious cases', () => {
  assert.equal(detectDrawCategory([c('Ah'), c('Kh')], [c('2h'), c('7h'), c('3d')]), 'flush-draw');
  assert.equal(detectDrawCategory([c('8h'), c('7c')], [c('6d'), c('5s'), c('Kc')]), 'open-ender');
  assert.equal(detectDrawCategory([c('Ah'), c('5c')], [c('4d'), c('3s'), c('Kc')]), 'gutshot');
  assert.equal(detectDrawCategory([c('Ah'), c('Kh')], [c('Qh'), c('Js'), c('2h')]), 'combo-draw');
});

test('street progression + generator validity', () => {
  const prompt = generateHandCategorySequencePrompt('medium', 'seed-1');
  const allCards = [...prompt.heroHand, ...prompt.runout.flop, prompt.runout.turn, prompt.runout.river].map(cardToString);
  assert.equal(new Set(allCards).size, 7);
  assert.equal(prompt.streets.flop.correctAnswer, evaluateHandCategory(prompt.heroHand, prompt.runout.flop).category);
  assert.equal(prompt.streets.turn.correctAnswer, evaluateHandCategory(prompt.heroHand, [...prompt.runout.flop, prompt.runout.turn]).category);
  assert.equal(prompt.streets.river.correctAnswer, evaluateHandCategory(prompt.heroHand, [...prompt.runout.flop, prompt.runout.turn, prompt.runout.river]).category);
  assert.doesNotThrow(() => generateHandCategorySequencePrompt('easy', 'x'));
  assert.doesNotThrow(() => generateHandCategorySequencePrompt('hard', 'x'));
});

test('street progression prompts even when category remains same', () => {
  assert.equal(nextStreet('flop'), 'turn');
  assert.equal(nextStreet('turn'), 'river');
  assert.equal(nextStreet('river'), null);
});


test('sequence seed generator yields unique advancing seeds', () => {
  const nextSeed = createSequenceSeedGenerator(1000);
  assert.equal(nextSeed(), 'session-1001');
  assert.equal(nextSeed(), 'session-1002');
  assert.equal(nextSeed(), 'session-1003');
});

test('settings behavior: correct can skip feedback, incorrect cannot', () => {
  assert.equal(shouldShowStreetFeedback(true, false), false);
  assert.equal(shouldShowStreetFeedback(true, true), true);
  assert.equal(shouldShowStreetFeedback(false, false), true);
});

test('session stats are drill-scoped', () => {
  let session = createDefaultSession();
  session = reduceSessionOnAnswer(session, {
    situation: { game: 'NLH', table: '9max', effectiveStackBb: 100, heroPos: 'CO', facingAction: 'none' },
    isCorrect: true,
    responseMs: 500,
  });
  session = reduceSessionOnAnswer(session, {
    situation: { game: 'NLH', table: '9max', effectiveStackBb: 100, heroPos: 'BTN', facingAction: 'open', villainPos: 'CO' },
    isCorrect: false,
    responseMs: 700,
  });

  assert.equal(session.byDrill.rfi.attempts, 1);
  assert.equal(session.byDrill.rfi.correct, 1);
  assert.equal(session.byDrill.facing_open.attempts, 1);
  assert.equal(session.byDrill.facing_open.correct, 0);
  assert.equal(session.byDrillResponseMs.rfi, 500);
  assert.equal(session.byDrillResponseMs.facing_open, 700);
});

test('historical stats are grouped by drill', () => {
  let data = createDefaultData();
  data = reduceAppDataStatsOnAnswer(data, {
    situation: { game: 'NLH', table: '9max', effectiveStackBb: 100, heroPos: 'CO', facingAction: 'none' },
    handClass: 'AKs',
    expectedAction: 'RAISE',
    policyKey: 'RFI_9MAX_100BB_CO',
    isCorrect: true,
    responseMs: 400,
  });
  data = reduceAppDataStatsOnAnswer(data, {
    situation: { game: 'NLH', table: '9max', effectiveStackBb: 100, heroPos: 'SB', facingAction: 'three_bet', villainPos: 'BB' },
    handClass: 'AJo',
    expectedAction: 'FOLD',
    policyKey: 'THREE_BET_9MAX_100BB_SB_VS_BB',
    isCorrect: false,
    responseMs: 900,
  });

  assert.equal(data.stats.byDrill.rfi.attempts, 1);
  assert.equal(data.stats.byDrill.three_bet.attempts, 1);
  assert.equal(data.stats.byDrill.facing_open.attempts, 0);
  assert.equal(data.stats.byDrillResponseMs.rfi > 0, true);
});

test('persistence migration keeps app/session loadable and maps set->trips misses', () => {
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
  delete (legacyData.stats as Record<string, unknown>).byDrill;
  delete (legacyData.stats as Record<string, unknown>).byDrillResponseMs;
  delete (legacyData.settings as Record<string, unknown>).showCorrectAnswerFeedback;
  (legacyData.stats.postflop.handCategory.missedByCategory as Record<string, number>).set = 3;
  localStorageMock.setItem('poker_range_drill_v2', JSON.stringify(legacyData));

  const loadedData = loadData();
  assert.equal(loadedData.settings.showCorrectAnswerFeedback, true);
  assert.equal(loadedData.stats.byDrill.rfi.attempts, 0);
  assert.equal(loadedData.stats.byDrillResponseMs.rfi, 0);
  assert.equal(loadedData.stats.postflop.handCategory.missedByCategory.trips, 3);

  const legacySession = createDefaultSession();
  delete (legacySession as unknown as Record<string, unknown>).byDrill;
  delete (legacySession as unknown as Record<string, unknown>).byDrillResponseMs;
  localStorageMock.setItem('poker_range_drill_session_v2', JSON.stringify(legacySession));
  const loadedSession = loadSession();
  assert.equal(loadedSession.byDrill.rfi.attempts, 0);
  assert.equal(loadedSession.byDrillResponseMs.rfi, 0);
});
