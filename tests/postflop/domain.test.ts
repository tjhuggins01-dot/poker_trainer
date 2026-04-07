import test from 'node:test';
import assert from 'node:assert/strict';
import { cardToString, parseCard } from '../../src/domain/postflop/cards.ts';
import { validateUniqueCards } from '../../src/domain/postflop/board.ts';
import { evaluateFlopHandCategory } from '../../src/domain/postflop/evaluate.ts';
import { detectDrawCategory } from '../../src/domain/postflop/draws.ts';
import { generateHandCategoryPrompt } from '../../src/domain/postflop/generators.ts';

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

test('evaluator categories', () => {
  assert.equal(evaluateFlopHandCategory([c('Ah'), c('Jc')], [c('Kd'), c('7s'), c('3h')]).category, 'high-card');
  assert.equal(evaluateFlopHandCategory([c('Ah'), c('Jc')], [c('Ad'), c('7s'), c('3h')]).category, 'one-pair');
  assert.equal(evaluateFlopHandCategory([c('Ah'), c('3c')], [c('Ad'), c('7s'), c('3h')]).category, 'two-pair');
  assert.equal(evaluateFlopHandCategory([c('Ah'), c('Ac')], [c('Ad'), c('7s'), c('3h')]).category, 'set');
  assert.equal(evaluateFlopHandCategory([c('Ah'), c('7c')], [c('Ad'), c('As'), c('3h')]).category, 'trips');
  assert.equal(evaluateFlopHandCategory([c('8h'), c('7c')], [c('6d'), c('5s'), c('4h')]).category, 'straight');
  assert.equal(evaluateFlopHandCategory([c('Ah'), c('2c')], [c('3d'), c('4s'), c('5h')]).category, 'straight');
  assert.equal(evaluateFlopHandCategory([c('9h'), c('8h')], [c('7h'), c('2h'), c('3h')]).category, 'flush');
  assert.equal(evaluateFlopHandCategory([c('Kh'), c('Kc')], [c('Kd'), c('3s'), c('3h')]).category, 'full-house');
  assert.equal(evaluateFlopHandCategory([c('Ah'), c('Ac')], [c('Ad'), c('As'), c('3h')]).category, 'quads');
});

test('set vs trips distinction fixtures', () => {
  assert.equal(evaluateFlopHandCategory([c('8h'), c('8c')], [c('8d'), c('Ks'), c('2h')]).category, 'set');
  assert.equal(evaluateFlopHandCategory([c('Ah'), c('7c')], [c('Ad'), c('As'), c('2h')]).category, 'trips');
  assert.notEqual(evaluateFlopHandCategory([c('Kh'), c('Qc')], [c('Ad'), c('As'), c('2h')]).category, 'trips');
});

test('draw detection obvious cases', () => {
  assert.equal(detectDrawCategory([c('Ah'), c('Kh')], [c('2h'), c('7h'), c('3d')]), 'flush-draw');
  assert.equal(detectDrawCategory([c('8h'), c('7c')], [c('6d'), c('5s'), c('Kc')]), 'open-ender');
  assert.equal(detectDrawCategory([c('Ah'), c('5c')], [c('4d'), c('3s'), c('Kc')]), 'gutshot');
  assert.equal(detectDrawCategory([c('Ah'), c('Kh')], [c('Qh'), c('Js'), c('2h')]), 'combo-draw');
});

test('generator validity and determinism', () => {
  const prompt = generateHandCategoryPrompt('medium', 'seed-1');
  const allCards = [...prompt.heroHand, ...prompt.board].map(cardToString);
  assert.equal(new Set(allCards).size, 5);
  const expected = evaluateFlopHandCategory(prompt.heroHand, prompt.board).category;
  assert.equal(prompt.correctAnswer, expected);
  assert.doesNotThrow(() => generateHandCategoryPrompt('easy', 'x'));
  assert.doesNotThrow(() => generateHandCategoryPrompt('hard', 'x'));
});
