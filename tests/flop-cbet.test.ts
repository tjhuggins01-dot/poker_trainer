import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateFlopCBetSelection,
  extendRangeNutEntryWithCBet,
  getAcceptedFlopCBetEntriesForSpot,
  getFlopCBetEntriesForSpot,
  labelFlopCBetAction,
  shuffleFlopCBetEntries,
  type FlopCBetEntry,
} from '../src/domain/postflop/flopCBetTrainer.ts';
import { getRangeNutQuizEntriesForSpot } from '../src/domain/postflop/rangeNutAdvantageQuiz.ts';
import { reduceDataOnFlopCBetAnswer, reduceSessionOnFlopCBetAnswer } from '../src/domain/postflop/flopCBetStats.ts';
import { createDefaultData, createDefaultSession } from '../src/domain/storage/defaultData.ts';

const SPOT = 'cash9max-100-btn-vs-bb-srp-flop' as const;

const byBoard = (entries: FlopCBetEntry[], board: string): FlopCBetEntry => {
  const found = entries.find((entry) => entry.board.join(' ') === board);
  assert.ok(found, `Expected board ${board} to exist in c-bet entries`);
  return found;
};

test('content extension keeps shared board library and adds c-bet fields', () => {
  const rangeNutEntries = getRangeNutQuizEntriesForSpot(SPOT);
  const cBetEntries = getFlopCBetEntriesForSpot(SPOT);

  assert.equal(cBetEntries.length, rangeNutEntries.length);
  cBetEntries.forEach((entry) => {
    assert.equal(typeof entry.acceptedForCBet, 'boolean');
    if (entry.acceptedForCBet) {
      assert.ok(entry.recommendedCBetAction);
      assert.ok(entry.cBetExplanation?.summary.length);
      assert.ok(entry.cBetTags && entry.cBetTags.length > 0);
    }
  });

  const rejected = cBetEntries.find((entry) => !entry.acceptedForCBet);
  assert.ok(rejected);
  assert.ok(rejected.cBetRejectionReason);
});

test('rubric maps representative boards to bet-small / bet-big / check', () => {
  const entries = getFlopCBetEntriesForSpot(SPOT);
  assert.equal(byBoard(entries, 'As 8d 3c').recommendedCBetAction, 'bet-small');
  assert.equal(byBoard(entries, 'Qh Jd 9c').recommendedCBetAction, 'bet-big');
  assert.equal(byBoard(entries, '7s 4d 2c').recommendedCBetAction, 'check');
  assert.equal(byBoard(entries, '8h 7d 6c').recommendedCBetAction, 'check');
  assert.equal(byBoard(entries, '8c 6c 3c').recommendedCBetAction, 'check');
});

test('ambiguous boards can be excluded from c-bet acceptance', () => {
  const entries = getFlopCBetEntriesForSpot(SPOT);
  const excluded = byBoard(entries, '7h 6d 5s');
  assert.equal(excluded.acceptedForCBet, false);
  assert.equal(excluded.recommendedCBetAction, null);

  const excludedDynamic = byBoard(entries, 'Ts 8s 6d');
  assert.equal(excludedDynamic.acceptedForCBet, false);
  assert.equal(excludedDynamic.recommendedCBetAction, null);
});

test('prompt loading includes only c-bet accepted boards for MVP spot', () => {
  const all = getFlopCBetEntriesForSpot(SPOT);
  const accepted = getAcceptedFlopCBetEntriesForSpot(SPOT);

  assert.ok(accepted.length > 0);
  assert.ok(accepted.length < all.length);
  assert.equal(accepted.every((entry) => entry.acceptedForCBet), true);
  assert.equal(accepted.every((entry) => entry.recommendedCBetAction !== null), true);
});

test('prompt order can be randomized so users cannot memorize static sequence', () => {
  const accepted = getAcceptedFlopCBetEntriesForSpot(SPOT);
  const originalOrder = accepted.map((entry) => entry.id);
  const shuffledOrder = shuffleFlopCBetEntries(accepted, () => 0).map((entry) => entry.id);

  assert.equal(shuffledOrder.length, originalOrder.length);
  assert.deepEqual([...shuffledOrder].sort(), [...originalOrder].sort());
  assert.notDeepEqual(shuffledOrder, originalOrder);
});

test('scoring marks correct vs incorrect action and retains explanation', () => {
  const entries = getAcceptedFlopCBetEntriesForSpot(SPOT);
  const prompt = byBoard(entries, 'Ks 8d 2c');
  assert.ok(prompt.cBetExplanation?.summary);
  assert.ok(prompt.cBetExplanation?.tags.some((tag) => tag.startsWith('advantage:')));

  const correctEval = evaluateFlopCBetSelection(prompt, prompt.recommendedCBetAction!);
  const incorrectEval = evaluateFlopCBetSelection(prompt, 'check');

  assert.equal(correctEval.correct, true);
  assert.equal(incorrectEval.correct, false);
});

test('stats are scoped to flop c-bet drill and do not mutate range/nut stats', () => {
  const data = createDefaultData();
  const session = createDefaultSession();
  const prompt = getAcceptedFlopCBetEntriesForSpot(SPOT)[0];
  const evaluation = evaluateFlopCBetSelection(prompt, prompt.recommendedCBetAction!);

  const nextSession = reduceSessionOnFlopCBetAnswer(session, evaluation, 800);
  assert.equal(nextSession.byDrill.postflop_flop_cbet.attempts, 1);
  assert.equal(nextSession.byDrill.postflop_range_nut_advantage.attempts, 0);
  assert.equal(nextSession.postflop.flopCBet.attempts, 1);
  assert.equal(nextSession.postflop.rangeNutAdvantage.attempts, 0);

  const nextData = reduceDataOnFlopCBetAnswer(data, prompt, evaluation, 800);
  assert.equal(nextData.stats.byDrill.postflop_flop_cbet.attempts, 1);
  assert.equal(nextData.stats.byDrill.postflop_range_nut_advantage.attempts, 0);
  assert.equal(nextData.stats.postflop.flopCBet.attempts, 1);
  assert.equal(nextData.stats.postflop.rangeNutAdvantage.attempts, 0);
});

test('regression: existing range/nut source entries are still readable and unchanged in size', () => {
  const entries = getRangeNutQuizEntriesForSpot(SPOT);
  assert.equal(entries.length, 29);
  const enriched = entries.map(extendRangeNutEntryWithCBet);
  assert.equal(enriched.length, entries.length);

  const dynamicBoard = entries.find((entry) => entry.board.join(' ') === 'Qs Jh 8d');
  assert.ok(dynamicBoard);
  assert.equal(labelFlopCBetAction(dynamicBoard), 'check');
});
