import { HandGrid, type GridActionColor } from './HandGrid';
import type { DrillAction, HandClass } from '../lib/types';

type Props = {
  correctAction: DrillAction;
  actionMap: Partial<Record<HandClass, string>>;
  actionColors: Record<string, GridActionColor>;
  testedHand: HandClass;
  percentages: string;
  onNext: () => void;
};

export function FeedbackPanel({ correctAction, actionMap, actionColors, testedHand, percentages, onNext }: Props) {
  return (
    <div className="feedback">
      <h3>Incorrect</h3>
      <p>Correct: {correctAction}</p>
      <p className="muted">{percentages}</p>
      <HandGrid actionMap={actionMap} actionColors={actionColors} testedHand={testedHand} />
      <button className="primary" onClick={onNext}>
        Next
      </button>
    </div>
  );
}
