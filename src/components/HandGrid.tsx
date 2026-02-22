import { RANKS, type HandClass } from '../lib/types';
import { gridCoordToHandClass } from '../lib/hands';

export type GridAction = 'raise' | 'limp' | 'call' | 'threebet' | 'fold';

type Props = { actionMap: Partial<Record<HandClass, GridAction>>; testedHand?: HandClass };

export function HandGrid({ actionMap, testedHand }: Props) {
  return (
    <div className="grid-wrap">
      <div className="hand-grid">
        {RANKS.map((_r, i) =>
          RANKS.map((_c, j) => {
            const hand = gridCoordToHandClass(i, j);
            const action = actionMap[hand] ?? 'fold';
            const tested = testedHand === hand;
            return (
              <div key={`${i}-${j}`} className={`cell action-${action} ${tested ? 'tested' : ''}`}>
                {hand}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
