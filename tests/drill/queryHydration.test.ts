import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultData } from '../../src/domain/storage/defaultData.ts';
import { createOneTimeQueryHydrator, hydrateDrillFromQuery } from '../../src/features/drill/hooks/queryHydration.ts';

test('query hydration is applied only once to prevent drill-type reset loops', () => {
  const base = createDefaultData();
  const params = new URLSearchParams('drill=facing_open&node=facingOpen&hero=UTG1&villain=UTG&format=cash9max&stack=100');
  const hydrateOnce = createOneTimeQueryHydrator();

  const hydrated = hydrateOnce(base, params);
  assert.equal(hydrated.settings.drillType, 'facing_open');

  const userChanged = {
    ...hydrated,
    settings: {
      ...hydrated.settings,
      drillType: 'three_bet' as const,
    },
  };

  const secondPass = hydrateOnce(userChanged, params);
  assert.equal(secondPass.settings.drillType, 'three_bet');
});

test('query hydration picks drill-eligible hero positions when drill type changes', () => {
  const base = createDefaultData();
  const params = new URLSearchParams('drill=limp_branch');

  const hydrated = hydrateDrillFromQuery(base, params);
  assert.equal(hydrated.settings.drillType, 'limp_branch');
  assert.equal(hydrated.settings.drillContext.heroPos, 'BB');
  assert.equal(hydrated.settings.drillContext.villainPos, 'SB');
});

test('query hydration supports postflop range/nut drill without overriding context keys', () => {
  const base = createDefaultData();
  const params = new URLSearchParams('drill=postflop_range_nut_advantage&node=facingOpen&hero=CO&villain=HJ');
  const hydrated = hydrateDrillFromQuery(base, params);

  assert.equal(hydrated.settings.drillType, 'postflop_range_nut_advantage');
  assert.equal(hydrated.settings.drillContext.nodeType, base.settings.drillContext.nodeType);
});
