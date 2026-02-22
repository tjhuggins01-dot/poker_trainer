import { HandGrid } from './HandGrid';
import type { Action, HandClass } from '../lib/types';

type Props = {
  correctAction: Action;
  openHands: HandClass[];
  testedHand: HandClass;
  onNext: () => void;
};

export function FeedbackPanel({ correctAction, openHands, testedHand, onNext }: Props) {
  return (
    <div className="feedback">
      <h3>Incorrect</h3>
      <p>Correct: {correctAction}</p>
      <HandGrid openHands={openHands} testedHand={testedHand} />
      <button className="primary" onClick={onNext}>
        Next
      </button>
    </div>
  );
}
