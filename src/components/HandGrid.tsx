import { RANKS, type HandClass } from '../lib/types';
import { gridCoordToHandClass } from '../lib/hands';

export type GridActionColor = 'raise' | 'limp' | 'call' | 'threebet' | 'fold';

type Props = {
  actionMap: Partial<Record<HandClass, string>>;
  actionColors?: Record<string, GridActionColor>;
  testedHand?: HandClass;
};

export function HandGrid({ actionMap, actionColors = {}, testedHand }: Props) {
  return (
    <div className="grid-wrap">
      <div className="hand-grid">
        {RANKS.map((_r, i) =>
          RANKS.map((_c, j) => {
            const hand = gridCoordToHandClass(i, j);
            const action = actionMap[hand] ?? 'FOLD';
            const color = actionColors[action] ?? 'fold';
            const tested = testedHand === hand;
            return (
              <div key={`${i}-${j}`} className={`cell action-${color} ${tested ? 'tested' : ''}`}>
                {hand}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
