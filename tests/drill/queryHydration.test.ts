import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultData } from '../../src/domain/storage/defaultData.ts';
import { createOneTimeQueryHydrator } from '../../src/features/drill/hooks/queryHydration.ts';

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
