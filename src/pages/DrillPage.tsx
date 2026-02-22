import { useMemo, useState } from 'react';
import { FeedbackPanel } from '../components/FeedbackPanel';
import { buildWeightedHandMap, computeCorrectAction, nextPrompt } from '../lib/logic';
import type { Action, AppData, SessionStats } from '../lib/types';

type Props = {
  data: AppData;
  session: SessionStats;
  onDataChange: (updater: (prev: AppData) => AppData) => void;
  onSessionChange: (updater: (prev: SessionStats) => SessionStats) => void;
  onResetSession: () => void;
};

export function DrillPage({ data, session, onDataChange, onSessionChange, onResetSession }: Props) {
  const weightedMap = useMemo(() => buildWeightedHandMap(data), [data]);
  const [prompt, setPrompt] = useState(() => nextPrompt(weightedMap));
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [correctAction, setCorrectAction] = useState<Action>('FOLD');

  const positionKey = `OPEN_9MAX_100BB_${prompt.position}`;
  const openHands = useMemo(
    () => data.situations[positionKey]?.policy.openHands ?? [],
    [data, positionKey],
  );

  const answer = (action: Action) => {
    const expected = computeCorrectAction(
      data,
      { seats: 9, effectiveStackBb: 100, position: prompt.position, facingAction: 'none' },
      prompt.handClass,
    );
    const ok = action === expected;
    setCorrectAction(expected);

    onSessionChange((prev) => {
      const next = structuredClone(prev);
      next.attempts += 1;
      next.byPosition[prompt.position].attempts += 1;
      if (ok) {
        next.correct += 1;
        next.byPosition[prompt.position].correct += 1;
      }
      return next;
    });

    onDataChange((prev) => {
      const next = structuredClone(prev);
      next.stats.total.attempts += 1;
      next.stats.byPosition[prompt.position].attempts += 1;
      next.stats.byHand[prompt.handClass] ??= { attempts: 0, correct: 0 };
      next.stats.byHand[prompt.handClass].attempts += 1;
      if (ok) {
        next.stats.total.correct += 1;
        next.stats.byPosition[prompt.position].correct += 1;
        next.stats.byHand[prompt.handClass].correct += 1;
      } else {
        const mKey = `${prompt.position}|${prompt.handClass}`;
        next.stats.mistakes[mKey] ??= { count: 0, lastTs: 0 };
        next.stats.mistakes[mKey].count += 1;
        next.stats.mistakes[mKey].lastTs = Date.now();
      }
      return next;
    });

    if (ok) {
      setStatus('correct');
      setTimeout(() => {
        setPrompt(nextPrompt(weightedMap));
        setStatus('idle');
      }, 350);
    } else {
      setStatus('incorrect');
    }
  };

  const sessionAccuracy = session.attempts === 0 ? 0 : (session.correct / session.attempts) * 100;

  return (
    <section>
      <h2>Drill</h2>
      <p className="muted">9-max • ~100bb • Opens</p>
      <div className="card">
        <p>Position: {prompt.position}</p>
        <p className="big-hand">{prompt.handClass}</p>
      </div>
      <div className="actions">
        <button className="open" onClick={() => answer('OPEN')}>
          OPEN
        </button>
        <button className="fold" onClick={() => answer('FOLD')}>
          FOLD
        </button>
      </div>
      <p className="session">
        Session: {session.correct}/{session.attempts} ({sessionAccuracy.toFixed(1)}%)
        {status === 'correct' ? ' ✅' : ''}
      </p>
      <button onClick={onResetSession}>Reset session</button>

      {status === 'incorrect' && (
        <FeedbackPanel
          correctAction={correctAction}
          openHands={openHands}
          testedHand={prompt.handClass}
          onNext={() => {
            setPrompt(nextPrompt(weightedMap));
            setStatus('idle');
          }}
        />
      )}
    </section>
  );
}
