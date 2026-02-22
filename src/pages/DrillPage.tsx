import { useEffect, useMemo, useRef, useState } from 'react';
import { FeedbackPanel } from '../components/FeedbackPanel';
import { buildWeightedHandMap, computeCorrectAction, nextPrompt } from '../lib/logic';
import { makeFacingOpenKey, makeRfiKey } from '../lib/storage';
import {
  FACING_OPEN_HERO_POSITIONS,
  RFI_POSITIONS,
  type AppData,
  type DrillAction,
  type FacingOpenHeroPosition,
  type RfiPosition,
  type SessionStats,
} from '../lib/types';

type Props = {
  data: AppData;
  session: SessionStats;
  onDataChange: (updater: (prev: AppData) => AppData) => void;
  onSessionChange: (updater: (prev: SessionStats) => SessionStats) => void;
  onResetSession: () => void;
};

export function DrillPage({ data, session, onDataChange, onSessionChange, onResetSession }: Props) {
  const weightedMap = useMemo(
    () => buildWeightedHandMap(data),
    [data.situations, data.settings.difficulty],
  );
  const [prompt, setPrompt] = useState(() => nextPrompt(data, weightedMap));
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [correctAction, setCorrectAction] = useState<DrillAction>('FOLD');
  const [shownNotice, setShownNotice] = useState(false);
  const [questionStartTs, setQuestionStartTs] = useState(() => Date.now());
  const nextPromptTimeoutRef = useRef<number | null>(null);
  const isAnswerLockedRef = useRef(false);

  const pickNextPrompt = (currentPrompt = prompt) => {
    let next = nextPrompt(data, weightedMap);
    if (
      next.handClass === currentPrompt.handClass &&
      next.situation.heroPos === currentPrompt.situation.heroPos &&
      next.situation.villainPos === currentPrompt.situation.villainPos &&
      next.situation.facingAction === currentPrompt.situation.facingAction
    ) {
      next = nextPrompt(data, weightedMap);
    }
    return next;
  };

  useEffect(() => {
    return () => {
      if (nextPromptTimeoutRef.current !== null) window.clearTimeout(nextPromptTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (nextPromptTimeoutRef.current !== null) {
      window.clearTimeout(nextPromptTimeoutRef.current);
      nextPromptTimeoutRef.current = null;
    }
    isAnswerLockedRef.current = false;
    const freshPrompt = nextPrompt(data, weightedMap);
    setPrompt(freshPrompt);
    setStatus('idle');
    setQuestionStartTs(Date.now());
  }, [data.settings.drillType, data.settings.positionFocus, data.situations, weightedMap]);

  const isFacingOpen = prompt.situation.facingAction === 'open';
  const key = isFacingOpen
    ? makeFacingOpenKey(prompt.situation.heroPos as FacingOpenHeroPosition, prompt.situation.villainPos!)
    : makeRfiKey(prompt.situation.heroPos as RfiPosition);
  const policy = data.situations[key]?.policy as any;

  const actionMap = useMemo(() => {
    const map: any = {};
    (policy?.raise ?? []).forEach((h: any) => (map[h] = 'raise'));
    (policy?.limp ?? []).forEach((h: any) => (map[h] = 'limp'));
    (policy?.call ?? []).forEach((h: any) => (map[h] = 'call'));
    (policy?.threeBet ?? []).forEach((h: any) => (map[h] = 'threebet'));
    return map;
  }, [policy]);

  const percentageText = useMemo(() => {
    if (isFacingOpen) {
      const call = policy?.call?.length ?? 0;
      const three = policy?.threeBet?.length ?? 0;
      return `Call ${((call / 169) * 100).toFixed(1)}% • 3bet ${((three / 169) * 100).toFixed(1)}% • Fold ${(((169 - call - three) / 169) * 100).toFixed(1)}%`;
    }
    const raise = policy?.raise?.length ?? 0;
    const limp = prompt.situation.heroPos === 'SB' ? policy?.limp?.length ?? 0 : 0;
    return `Raise ${((raise / 169) * 100).toFixed(1)}%${prompt.situation.heroPos === 'SB' ? ` • Limp ${((limp / 169) * 100).toFixed(1)}%` : ''} • Fold ${(((169 - raise - limp) / 169) * 100).toFixed(1)}%`;
  }, [isFacingOpen, policy, prompt.situation.heroPos]);

  const stepNext = () => {
    if (nextPromptTimeoutRef.current !== null) {
      window.clearTimeout(nextPromptTimeoutRef.current);
      nextPromptTimeoutRef.current = null;
    }
    isAnswerLockedRef.current = false;
    setPrompt(pickNextPrompt());
    setQuestionStartTs(Date.now());
    setStatus('idle');
  };

  const answer = (action: DrillAction) => {
    if (isAnswerLockedRef.current || status !== 'idle') return;
    isAnswerLockedRef.current = true;

    const expected = computeCorrectAction(data, prompt.situation, prompt.handClass);
    const ok = action === expected;
    setCorrectAction(expected);
    const responseMs = Date.now() - questionStartTs;

    onSessionChange((prev) => {
      const next = structuredClone(prev);
      next.attempts += 1;
      next.totalResponseMs += responseMs;
      if (prompt.situation.facingAction === 'open') {
        next.byFacingHero[prompt.situation.heroPos as FacingOpenHeroPosition].attempts += 1;
        if (ok) next.byFacingHero[prompt.situation.heroPos as FacingOpenHeroPosition].correct += 1;
      } else {
        next.byRfiPosition[prompt.situation.heroPos as RfiPosition].attempts += 1;
        if (ok) next.byRfiPosition[prompt.situation.heroPos as RfiPosition].correct += 1;
      }
      if (ok) next.correct += 1;
      return next;
    });

    onDataChange((prev) => {
      const next = structuredClone(prev);
      next.stats.total.attempts += 1;
      next.stats.byHand[prompt.handClass] ??= { attempts: 0, correct: 0 };
      next.stats.byHand[prompt.handClass].attempts += 1;
      if (prompt.situation.facingAction === 'open') {
        const hero = prompt.situation.heroPos as FacingOpenHeroPosition;
        next.stats.byFacingHero[hero].attempts += 1;
        const matchup = `${prompt.situation.heroPos}vs${prompt.situation.villainPos}`;
        next.stats.byFacingMatchup[matchup] ??= { attempts: 0, correct: 0 };
        next.stats.byFacingMatchup[matchup].attempts += 1;
      } else {
        next.stats.byRfiPosition[prompt.situation.heroPos as RfiPosition].attempts += 1;
      }

      if (ok) {
        next.stats.total.correct += 1;
        next.stats.byHand[prompt.handClass].correct += 1;
        if (prompt.situation.facingAction === 'open') {
          const hero = prompt.situation.heroPos as FacingOpenHeroPosition;
          next.stats.byFacingHero[hero].correct += 1;
          const matchup = `${prompt.situation.heroPos}vs${prompt.situation.villainPos}`;
          next.stats.byFacingMatchup[matchup].correct += 1;
        } else {
          next.stats.byRfiPosition[prompt.situation.heroPos as RfiPosition].correct += 1;
        }
      } else {
        const mKey =
          prompt.situation.facingAction === 'open'
            ? `${prompt.situation.heroPos}vs${prompt.situation.villainPos}|${prompt.handClass}|${expected}`
            : `${prompt.situation.heroPos}|${prompt.handClass}|${expected}`;
        next.stats.mistakes[mKey] ??= { count: 0, lastTs: 0 };
        next.stats.mistakes[mKey].count += 1;
        next.stats.mistakes[mKey].lastTs = Date.now();
      }
      return next;
    });

    if (ok) {
      setStatus('correct');
      if (nextPromptTimeoutRef.current !== null) window.clearTimeout(nextPromptTimeoutRef.current);
      nextPromptTimeoutRef.current = window.setTimeout(() => {
        nextPromptTimeoutRef.current = null;
        stepNext();
      }, 300);
    } else {
      setStatus('incorrect');
      isAnswerLockedRef.current = false;
    }
  };

  const sessionAccuracy = session.attempts === 0 ? 0 : (session.correct / session.attempts) * 100;
  const avgResponse = session.attempts === 0 ? 0 : session.totalResponseMs / session.attempts;

  const focusOptions = data.settings.drillType === 'rfi' ? RFI_POSITIONS : FACING_OPEN_HERO_POSITIONS;
  const selectedFocus =
    data.settings.drillType === 'rfi' ? data.settings.positionFocus.rfi : data.settings.positionFocus.facing_open;

  return (
    <section>
      <h2>Drill</h2>
      {data.migrationNotice && !shownNotice && (
        <div className="card">
          <p>{data.migrationNotice}</p>
          <button onClick={() => setShownNotice(true)}>Dismiss</button>
        </div>
      )}
      <label htmlFor="drill-type">Drill Type</label>
      <select
        id="drill-type"
        value={data.settings.drillType}
        onChange={(e: any) =>
          onDataChange((prev) => ({ ...prev, settings: { ...prev.settings, drillType: e.target.value } as any }))
        }
      >
        <option value="rfi">Open First In (RFI)</option>
        <option value="facing_open">Facing an Open</option>
      </select>

      <p className="muted">Position Focus</p>
      <div className="row wrap">
        {focusOptions.map((position) => (
          <label key={position}>
            <input
              type="checkbox"
              checked={(selectedFocus as string[]).includes(position)}
              onChange={(e: any) =>
                onDataChange((prev) => {
                  const next = structuredClone(prev);
                  const keyFocus = prev.settings.drillType;
                  const list = new Set(next.settings.positionFocus[keyFocus]);
                  if (e.target.checked) list.add(position as any);
                  else list.delete(position as any);
                  next.settings.positionFocus[keyFocus] = [...list] as any;
                  return next;
                })
              }
            />{' '}
            {position}
          </label>
        ))}
      </div>

      <div className="card">
        <p>Hero: {prompt.situation.heroPos}</p>
        {isFacingOpen && <p>Facing open from: {prompt.situation.villainPos}</p>}
        <p className="big-hand">{prompt.handClass}</p>
      </div>
      <div className="actions">
        {isFacingOpen ? (
          <>
            <button className="fold" onClick={() => answer('FOLD')}>
              FOLD
            </button>
            <button className="open" onClick={() => answer('CALL')}>
              CALL
            </button>
            <button className="primary" onClick={() => answer('3BET')}>
              3BET
            </button>
          </>
        ) : (
          <>
            <button className="open" onClick={() => answer('RAISE')}>
              RAISE
            </button>
            {prompt.situation.heroPos === 'SB' && (
              <button className="primary" onClick={() => answer('LIMP')}>
                LIMP
              </button>
            )}
            <button className="fold" onClick={() => answer('FOLD')}>
              FOLD
            </button>
          </>
        )}
      </div>
      <p className="session">
        Session: {session.correct}/{session.attempts} ({sessionAccuracy.toFixed(1)}%) • Avg response{' '}
        {avgResponse.toFixed(0)}ms {status === 'correct' ? '✅' : ''}
      </p>
      <button onClick={onResetSession}>Reset session</button>

      {status === 'incorrect' && (
        <FeedbackPanel
          correctAction={correctAction}
          actionMap={actionMap}
          testedHand={prompt.handClass}
          percentages={percentageText}
          onNext={stepNext}
        />
      )}
    </section>
  );
}
