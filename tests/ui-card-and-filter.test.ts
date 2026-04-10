import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCard } from '../src/domain/postflop/cards.ts';
import { cardAriaLabel, isRedSuit, SUIT_SYMBOL } from '../src/components/cardUtils.ts';
import { createDefaultData } from '../src/domain/storage/defaultData.ts';
import { buildWeightedHandMap, nextPrompt } from '../src/lib/logic.ts';

const parseCards = (cards: string[]) => cards.map(parseCard);

test('card labels and suit symbols are represented consistently', () => {
  const [aceHeart, tenClub] = parseCards(['Ah', 'Tc']);
  assert.equal(cardAriaLabel(aceHeart), 'Ace of hearts');
  assert.equal(cardAriaLabel(tenClub), 'Ten of clubs');
  assert.equal(SUIT_SYMBOL[aceHeart.suit], '♥');
  assert.equal(SUIT_SYMBOL[tenClub.suit], '♣');
});

test('suit helpers classify red and black suits correctly', () => {
  assert.equal(isRedSuit('h'), true);
  assert.equal(isRedSuit('d'), true);
  assert.equal(isRedSuit('s'), false);
  assert.equal(isRedSuit('c'), false);
});

test('board/hand parsing keeps expected card counts for display rows', () => {
  const hand = parseCards(['As', 'Kd']);
  const board = parseCards(['Qs', '7d', '2c']);
  assert.equal(hand.length, 2);
  assert.equal(board.length, 3);
});

test('villain focus filter constrains generated facing-open prompts', () => {
  const data = createDefaultData();
  data.settings.drillContext.nodeType = 'facingOpen';
  data.settings.drillType = 'facing_open';
  data.settings.positionFocus.facing_open = ['CO'];
  data.settings.villainFocus.facing_open = ['HJ'];

  const weightedMap = buildWeightedHandMap(data);
  for (let i = 0; i < 20; i += 1) {
    const prompt = nextPrompt(data, weightedMap);
    assert.equal(prompt.situation.heroPos, 'CO');
    assert.equal(prompt.situation.villainPos, 'HJ');
    assert.equal(prompt.situation.facingAction, 'open');
  }
});


test('when villain filter excludes all options, prompt stays in active node via safe fallback', () => {
  const data = createDefaultData();
  data.settings.drillContext.nodeType = 'facingOpen';
  data.settings.drillType = 'facing_open';
  data.settings.positionFocus.facing_open = ['UTG1'];
  data.settings.villainFocus.facing_open = ['BB'];

  const weightedMap = buildWeightedHandMap(data);
  const prompt = nextPrompt(data, weightedMap);
  assert.equal(prompt.situation.facingAction, 'open');
  assert.equal(prompt.situation.heroPos, 'UTG1');
  assert.equal(prompt.situation.villainPos, 'UTG');
});
