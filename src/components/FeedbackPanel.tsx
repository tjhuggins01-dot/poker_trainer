import { HandGrid, type GridAction } from './HandGrid';
import type { DrillAction, HandClass } from '../lib/types';

type Props = {
  correctAction: DrillAction;
  actionMap: Partial<Record<HandClass, GridAction>>;
  testedHand: HandClass;
  percentages: string;
  onNext: () => void;
};

export function FeedbackPanel({ correctAction, actionMap, testedHand, percentages, onNext }: Props) {
  return (
    <div className="feedback">
      <h3>Incorrect</h3>
      <p>Correct: {correctAction}</p>
      <p className="muted">{percentages}</p>
      <HandGrid actionMap={actionMap} testedHand={testedHand} />
      <button className="primary" onClick={onNext}>
        Next
      </button>
    </div>
  );
}
