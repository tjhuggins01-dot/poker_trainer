import type { DrillType, SessionStats } from '../../../lib/types';

type Props = {
  session: SessionStats;
  drillType: DrillType;
  status: 'idle' | 'correct' | 'incorrect';
  onResetSession: () => void;
};

export function SessionSummary({ session, drillType, status, onResetSession }: Props) {
  const attempts = session.byDrill[drillType].attempts;
  const correct = session.byDrill[drillType].correct;
  const sessionAccuracy = attempts === 0 ? 0 : (correct / attempts) * 100;
  const avgResponse = attempts === 0 ? 0 : session.byDrillResponseMs[drillType] / attempts;

  return (
    <>
      <p className="session">
        Session: {correct}/{attempts} ({sessionAccuracy.toFixed(1)}%) • Avg response{' '}
        {avgResponse.toFixed(0)}ms {status === 'correct' ? '✅' : ''}
      </p>
      <button onClick={onResetSession}>Reset session</button>
    </>
  );
}
