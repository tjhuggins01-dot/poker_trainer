import { RANKS, type HandClass } from '../lib/types';
import { gridCoordToHandClass } from '../lib/hands';

type Props = { openHands: HandClass[]; testedHand?: HandClass };

export function HandGrid({ openHands, testedHand }: Props) {
  const openSet = new Set(openHands);
  return (
    <div className="grid-wrap">
      <div className="hand-grid">
        {RANKS.map((r, i) =>
          RANKS.map((c, j) => {
            const hand = gridCoordToHandClass(i, j);
            const open = openSet.has(hand);
            const tested = testedHand === hand;
            return (
              <div key={`${i}-${j}`} className={`cell ${open ? 'open' : ''} ${tested ? 'tested' : ''}`}>
                {hand}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
