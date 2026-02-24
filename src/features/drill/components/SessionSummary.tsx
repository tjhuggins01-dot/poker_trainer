import type { SessionStats } from '../../../lib/types';

type Props = {
  session: SessionStats;
  status: 'idle' | 'correct' | 'incorrect';
  onResetSession: () => void;
};

export function SessionSummary({ session, status, onResetSession }: Props) {
  const sessionAccuracy = session.attempts === 0 ? 0 : (session.correct / session.attempts) * 100;
  const avgResponse = session.attempts === 0 ? 0 : session.totalResponseMs / session.attempts;

  return (
    <>
      <p className="session">
        Session: {session.correct}/{session.attempts} ({sessionAccuracy.toFixed(1)}%) • Avg response{' '}
        {avgResponse.toFixed(0)}ms {status === 'correct' ? '✅' : ''}
      </p>
      <button onClick={onResetSession}>Reset session</button>
    </>
  );
}
