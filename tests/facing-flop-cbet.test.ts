import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateFacingFlopCBetSelection,
  FACING_FLOP_CBET_MVP_SPOT_ID,
  getFacingFlopCBetAcceptedPromptsForSpot,
  getFacingFlopCBetReviewPromptsForSpot,
  getFacingFlopCBetSpotCatalog,
  nextFacingFlopCBetPromptIndex,
  shuffleFacingFlopCBetPrompts,
} from '../src/domain/postflop/facingFlopCBetTrainer.ts';
import {
  reduceDataOnFacingFlopCBetAnswer,
  reduceSessionOnFacingFlopCBetAnswer,
} from '../src/domain/postflop/facingFlopCBetStats.ts';
import { createDefaultData, createDefaultSession } from '../src/domain/storage/defaultData.ts';

const byId = (idPart: string) => {
  const found = getFacingFlopCBetAcceptedPromptsForSpot(FACING_FLOP_CBET_MVP_SPOT_ID).find((entry) => entry.id.includes(idPart));
  assert.ok(found, `Missing prompt matching ${idPart}`);
  return found;
};

test('content loading: accepted and review libraries load with required size bucket and reasons', () => {
  const catalog = getFacingFlopCBetSpotCatalog();
  assert.equal(catalog.some((spot) => spot.id === FACING_FLOP_CBET_MVP_SPOT_ID), true);

  const accepted = getFacingFlopCBetAcceptedPromptsForSpot(FACING_FLOP_CBET_MVP_SPOT_ID);
  const review = getFacingFlopCBetReviewPromptsForSpot(FACING_FLOP_CBET_MVP_SPOT_ID);

  assert.ok(accepted.length >= 80);
  assert.ok(review.length > accepted.length);
  assert.equal(accepted.every((entry) => entry.cBetSizeBucket === 'small' || entry.cBetSizeBucket === 'big'), true);
  assert.equal(accepted.every((entry) => entry.recommendedResponse === 'fold' || entry.recommendedResponse === 'call' || entry.recommendedResponse === 'raise'), true);
  assert.equal(review.some((entry) => entry.accepted === false && typeof entry.rejectionReason === 'string'), true);
});

test('rubric shape: obvious weak hands fold, medium hands call, and strong hands raise', () => {
  assert.equal(byId('a-high-dry-air-small').recommendedResponse, 'fold');
  assert.equal(byId('a-high-dry-strong-top-big').recommendedResponse, 'call');
  assert.equal(byId('qj-high-dynamic-strong-equity-small').recommendedResponse, 'raise');
});

test('size bucket can change response for same board and hand', () => {
  const small = byId('a-high-dry-overcards-bd-small');
  const big = byId('a-high-dry-overcards-bd-big');
  assert.deepEqual(small.board, big.board);
  assert.deepEqual(small.heroHand, big.heroHand);
  assert.equal(small.recommendedResponse, 'call');
  assert.equal(big.recommendedResponse, 'fold');
});

test('prompt loading includes only accepted prompts for MVP spot', () => {
  const accepted = getFacingFlopCBetAcceptedPromptsForSpot(FACING_FLOP_CBET_MVP_SPOT_ID);
  const review = getFacingFlopCBetReviewPromptsForSpot(FACING_FLOP_CBET_MVP_SPOT_ID);
  const acceptedIds = new Set(accepted.map((entry) => entry.id));

  assert.equal(accepted.every((entry) => entry.explanation.summary.length > 0), true);
  assert.equal(review.filter((entry) => entry.accepted).every((entry) => acceptedIds.has(entry.id)), true);
  assert.equal(review.some((entry) => !entry.accepted && entry.recommendedResponse === null), true);
});

test('scoring and explanation retrieval use stored prompt answers', () => {
  const prompt = byId('k-high-dry-weak-pair-small');
  assert.ok(prompt.explanation.summary.length > 0);

  const correct = evaluateFacingFlopCBetSelection(prompt, prompt.recommendedResponse);
  const wrong = evaluateFacingFlopCBetSelection(prompt, prompt.recommendedResponse === 'call' ? 'fold' : 'call');
  assert.equal(correct.correct, true);
  assert.equal(wrong.correct, false);
});

test('stats are scoped to facing flop c-bet drill and do not leak into analyzer or other drills', () => {
  const data = createDefaultData();
  const session = createDefaultSession();
  const prompt = byId('paired-low-strong-top-small');
  const evaluation = evaluateFacingFlopCBetSelection(prompt, prompt.recommendedResponse);

  const nextSession = reduceSessionOnFacingFlopCBetAnswer(session, evaluation, 700);
  assert.equal(nextSession.byDrill.postflop_facing_flop_cbet.attempts, 1);
  assert.equal(nextSession.byDrill.postflop_flop_cbet.attempts, 0);
  assert.equal(nextSession.postflop.facingFlopCBet.attempts, 1);
  assert.equal(nextSession.postflop.rangeNutAdvantage.attempts, 0);

  const nextData = reduceDataOnFacingFlopCBetAnswer(data, prompt, evaluation, 700);
  assert.equal(nextData.stats.byDrill.postflop_facing_flop_cbet.attempts, 1);
  assert.equal(nextData.stats.byDrill.postflop_range_nut_advantage.attempts, 0);
  assert.equal(nextData.stats.postflop.facingFlopCBet.attempts, 1);
  assert.equal(nextData.settings.analyzer.mode, data.settings.analyzer.mode);
});

test('shuffle and prompt index helpers support stable drill flow', () => {
  const accepted = getFacingFlopCBetAcceptedPromptsForSpot(FACING_FLOP_CBET_MVP_SPOT_ID);
  const shuffled = shuffleFacingFlopCBetPrompts(accepted, () => 0.1);
  assert.equal(shuffled.length, accepted.length);
  assert.notDeepEqual(shuffled.map((entry) => entry.id), accepted.map((entry) => entry.id));

  assert.equal(nextFacingFlopCBetPromptIndex(0, accepted.length), 1);
  assert.equal(nextFacingFlopCBetPromptIndex(accepted.length - 1, accepted.length), 0);
  assert.equal(nextFacingFlopCBetPromptIndex(0, 0), 0);
});

test('prompt payload includes UI-facing hand/board/size context fields', () => {
  const prompt = byId('monotone-low-strong-equity-big');
  assert.equal(prompt.heroHand.length, 2);
  assert.equal(prompt.board.length, 3);
  assert.equal(prompt.cBetSizeBucket, 'big');
  assert.ok(prompt.cBetSizeBb > 0);
  assert.ok(prompt.potSizeBb > 0);
});

test('accepted prompts use valid non-overlapping card combinations and broad family coverage', () => {
  const accepted = getFacingFlopCBetAcceptedPromptsForSpot(FACING_FLOP_CBET_MVP_SPOT_ID);
  const families = new Set<string>();

  for (const prompt of accepted) {
    const uniqueCards = new Set([...prompt.board, ...prompt.heroHand]);
    assert.equal(uniqueCards.size, 5, `Prompt has card collision: ${prompt.id}`);
    const familyTag = prompt.tags.find((tag) => tag.startsWith('family:'));
    assert.ok(familyTag, `Prompt missing family tag: ${prompt.id}`);
    if (familyTag) families.add(familyTag);
  }

  assert.ok(families.size >= 12);
});

test('review set keeps explicit ambiguous rejections for each family and both size buckets', () => {
  const review = getFacingFlopCBetReviewPromptsForSpot(FACING_FLOP_CBET_MVP_SPOT_ID);
  const rejected = review.filter((prompt) => !prompt.accepted);
  const familyBuckets = new Set<string>();

  for (const prompt of rejected) {
    const familyTag = prompt.tags.find((tag) => tag.startsWith('family:'));
    assert.ok(familyTag, `Rejected prompt missing family tag: ${prompt.id}`);
    assert.ok(prompt.rejectionReason && prompt.rejectionReason.length > 0, `Rejected prompt missing reason: ${prompt.id}`);
    familyBuckets.add(`${familyTag}|${prompt.cBetSizeBucket}`);
  }

  assert.equal(rejected.length, 24);
  assert.equal(familyBuckets.size, 24);
});

test('accepted/review ids are unique and size-bucket action spread remains teachable', () => {
  const accepted = getFacingFlopCBetAcceptedPromptsForSpot(FACING_FLOP_CBET_MVP_SPOT_ID);
  const review = getFacingFlopCBetReviewPromptsForSpot(FACING_FLOP_CBET_MVP_SPOT_ID);
  const acceptedIds = new Set(accepted.map((entry) => entry.id));
  const reviewIds = new Set(review.map((entry) => entry.id));
  assert.equal(acceptedIds.size, accepted.length);
  assert.equal(reviewIds.size, review.length);

  const responsesBySize = accepted.reduce<Record<'small' | 'big', Set<string>>>(
    (acc, entry) => {
      acc[entry.cBetSizeBucket].add(entry.recommendedResponse);
      return acc;
    },
    { small: new Set<string>(), big: new Set<string>() },
  );

  assert.deepEqual([...responsesBySize.small].sort(), ['call', 'fold', 'raise']);
  assert.deepEqual([...responsesBySize.big].sort(), ['call', 'fold', 'raise']);
});

test('regression: existing flop c-bet drill and range/nut drill stats buckets stay initialized', () => {
  const data = createDefaultData();
  assert.equal(data.stats.byDrill.postflop_flop_cbet.attempts, 0);
  assert.equal(data.stats.byDrill.postflop_range_nut_advantage.attempts, 0);
  assert.equal(data.stats.postflop.flopCBet.attempts, 0);
  assert.equal(data.stats.postflop.rangeNutAdvantage.attempts, 0);
});
