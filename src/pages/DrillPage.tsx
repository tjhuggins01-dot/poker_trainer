import { useEffect, useMemo, useRef, useState } from 'react';
import { FeedbackPanel } from '../components/FeedbackPanel';
import {
  buildPromptMemoryKey,
  buildWeightedHandMap,
  computeCorrectAction,
  getPromptSignature,
  nextPrompt,
  updatePromptMemory,
} from '../lib/logic';
import { fromLegacyDrillType, isEligibleContext, parseContextQuery, toLegacyDrillType } from '../lib/domain';
import { actionSetToColorMap, policyToActionMap } from '../domain/policy/mappers';
import { policyKeyFromSituation } from '../domain/policy/resolver';
import {
  FACING_OPEN_HERO_POSITIONS,
  RFI_POSITIONS,
  THREE_BET_HERO_POSITIONS,
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
  const situationsPolicyKey = useMemo(
    () =>
      Object.entries(data.situations)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, situation]) => `${key}:${situation.drillType}:${JSON.stringify(situation.policy)}`)
        .join('|'),
    [data.situations],
  );
  const weightedMap = useMemo(() => buildWeightedHandMap(data), [situationsPolicyKey, data.settings.difficulty]);
  const selectedFocusKey = useMemo(() => {
    const focus = data.settings.positionFocus[data.settings.drillType] as string[];
    return [...focus].sort().join('|');
  }, [data.settings.drillType, data.settings.positionFocus]);
  const drillResetKey = `${data.settings.drillType}:${selectedFocusKey}:${data.settings.difficulty}:${data.settings.drillContext.format}:${data.settings.drillContext.effectiveStackBb}:${situationsPolicyKey}`;

  useEffect(() => {
    const parsed = parseContextQuery(new URLSearchParams(window.location.search));
    if (!Object.values(parsed).some(Boolean)) return;
    onDataChange((prev) => {
      const mergedContext = {
        ...prev.settings.drillContext,
        ...parsed,
      };
      const candidateContext = {
        ...mergedContext,
        villainPos: mergedContext.nodeType === 'rfi' ? undefined : mergedContext.villainPos,
      };
      if (!isEligibleContext(candidateContext, prev)) {
        return prev;
      }
      return {
        ...prev,
        settings: {
          ...prev.settings,
          drillContext: candidateContext,
          drillType: toLegacyDrillType(candidateContext.nodeType),
        },
      };
    });
  }, []);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    q.set('format', data.settings.drillContext.format);
    q.set('stack', String(data.settings.drillContext.effectiveStackBb));
    q.set('node', data.settings.drillContext.nodeType);
    q.set('hero', data.settings.drillContext.heroPos);
    if (data.settings.drillContext.villainPos) q.set('villain', data.settings.drillContext.villainPos);
    else q.delete('villain');
    const nextUrl = `${window.location.pathname}?${q.toString()}${window.location.hash}`;
    window.history.replaceState(null, '', nextUrl);
  }, [data.settings.drillContext]);

  const stackPrefix = `${data.settings.drillContext.format}_${data.settings.drillContext.effectiveStackBb}BB_`;
  const hasRfiData = Object.keys(data.situations).some((k) => k.startsWith(`RFI_${stackPrefix}`));
  const hasFacingOpenData = Object.keys(data.situations).some((k) => k.startsWith(`FACING_OPEN_${stackPrefix}`));
  const hasThreeBetData = Object.keys(data.situations).some((k) => k.startsWith(`THREE_BET_${stackPrefix}`));

  const [prompt, setPrompt] = useState(() => nextPrompt(data, weightedMap));
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [correctAction, setCorrectAction] = useState<DrillAction>('FOLD');
  const [shownNotice, setShownNotice] = useState(false);
  const [questionStartTs, setQuestionStartTs] = useState(() => Date.now());
  const nextPromptTimeoutRef = useRef<number | null>(null);
  const isAnswerLockedRef = useRef(false);
  const recentPromptSignaturesRef = useRef<string[]>([]);

  const clearNextPromptTimeout = () => {
    if (nextPromptTimeoutRef.current === null) return;
    window.clearTimeout(nextPromptTimeoutRef.current);
    nextPromptTimeoutRef.current = null;
  };

  const scheduleNextPrompt = (delayMs = 300) => {
    clearNextPromptTimeout();
    nextPromptTimeoutRef.current = window.setTimeout(() => {
      nextPromptTimeoutRef.current = null;
      stepNext();
    }, delayMs);
  };

  const cancelAndResetDrillState = () => {
    clearNextPromptTimeout();
    isAnswerLockedRef.current = false;
    setStatus('idle');
    setQuestionStartTs(Date.now());
  };

  const pickNextPrompt = (currentPrompt = prompt) => {
    const recent = recentPromptSignaturesRef.current;
    const withCurrent = [...recent, getPromptSignature(currentPrompt.situation, currentPrompt.handClass)];
    const next = nextPrompt(data, weightedMap, withCurrent);
    const nextSignature = getPromptSignature(next.situation, next.handClass);
    recentPromptSignaturesRef.current = [...withCurrent, nextSignature].slice(-4);
    return next;
  };

  useEffect(() => () => clearNextPromptTimeout(), []);

  useEffect(() => {
    cancelAndResetDrillState();
    recentPromptSignaturesRef.current = [];
    const freshPrompt = nextPrompt(data, weightedMap);
    recentPromptSignaturesRef.current = [getPromptSignature(freshPrompt.situation, freshPrompt.handClass)];
    setPrompt(freshPrompt);
  }, [drillResetKey]);

  const isFacingOpen = prompt.situation.facingAction === 'open';
  const isThreeBet = prompt.situation.facingAction === 'three_bet';
  const key = policyKeyFromSituation(
    prompt.situation,
    data.settings.drillContext.format,
    data.settings.drillContext.effectiveStackBb,
  );
  const policy = data.situations[key]?.policy as any;

  const actionColors = useMemo(() => actionSetToColorMap(data.situations[key]?.actionSet), [data.situations, key]);

  const actionMap = useMemo(() => policyToActionMap(policy), [policy]);

  const percentageText = useMemo(() => {
    if (isFacingOpen || isThreeBet) {
      const call = policy?.call?.length ?? 0;
      const three = (policy?.threeBet?.length ?? 0) + (policy?.fourBet?.length ?? 0);
      const label = isThreeBet ? '4bet' : '3bet';
      return `Call ${((call / 169) * 100).toFixed(1)}% • ${label} ${((three / 169) * 100).toFixed(1)}% • Fold ${(((169 - call - three) / 169) * 100).toFixed(1)}%`;
    }
    const raise = policy?.raise?.length ?? 0;
    const limp = prompt.situation.heroPos === 'SB' ? policy?.limp?.length ?? 0 : 0;
    return `Raise ${((raise / 169) * 100).toFixed(1)}%${prompt.situation.heroPos === 'SB' ? ` • Limp ${((limp / 169) * 100).toFixed(1)}%` : ''} • Fold ${(((169 - raise - limp) / 169) * 100).toFixed(1)}%`;
  }, [isFacingOpen, isThreeBet, policy, prompt.situation.heroPos]);

  const stepNext = () => {
    cancelAndResetDrillState();
    setPrompt(pickNextPrompt());
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
      const byHandEntry = prev.stats.byHand[prompt.handClass] ?? { attempts: 0, correct: 0 };
      const byHand = {
        ...prev.stats.byHand,
        [prompt.handClass]: {
          attempts: byHandEntry.attempts + 1,
          correct: byHandEntry.correct + (ok ? 1 : 0),
        },
      };

      const total = {
        attempts: prev.stats.total.attempts + 1,
        correct: prev.stats.total.correct + (ok ? 1 : 0),
      };

      let byFacingHero = prev.stats.byFacingHero;
      let byFacingMatchup = prev.stats.byFacingMatchup;
      let byRfiPosition = prev.stats.byRfiPosition;

      if (prompt.situation.facingAction === 'open') {
        const hero = prompt.situation.heroPos as FacingOpenHeroPosition;
        const matchup = `${prompt.situation.heroPos}vs${prompt.situation.villainPos}`;
        const heroEntry = prev.stats.byFacingHero[hero];
        const matchupEntry = prev.stats.byFacingMatchup[matchup] ?? { attempts: 0, correct: 0 };

        byFacingHero = {
          ...prev.stats.byFacingHero,
          [hero]: {
            attempts: heroEntry.attempts + 1,
            correct: heroEntry.correct + (ok ? 1 : 0),
          },
        };

        byFacingMatchup = {
          ...prev.stats.byFacingMatchup,
          [matchup]: {
            attempts: matchupEntry.attempts + 1,
            correct: matchupEntry.correct + (ok ? 1 : 0),
          },
        };
      } else {
        const hero = prompt.situation.heroPos as RfiPosition;
        const heroEntry = prev.stats.byRfiPosition[hero];
        byRfiPosition = {
          ...prev.stats.byRfiPosition,
          [hero]: {
            attempts: heroEntry.attempts + 1,
            correct: heroEntry.correct + (ok ? 1 : 0),
          },
        };
      }

      const mistakes = !ok
        ? (() => {
            const mKey =
              prompt.situation.facingAction === 'open'
                ? `${prompt.situation.heroPos}vs${prompt.situation.villainPos}|${prompt.handClass}|${expected}`
                : `${prompt.situation.heroPos}|${prompt.handClass}|${expected}`;
            const prevEntry = prev.stats.mistakes[mKey] ?? { count: 0, lastTs: 0 };
            return {
              ...prev.stats.mistakes,
              [mKey]: {
                count: prevEntry.count + 1,
                lastTs: Date.now(),
              },
            };
          })()
        : prev.stats.mistakes;

      const memoryKey = buildPromptMemoryKey(key, prompt.handClass);
      const promptMemory = {
        ...prev.stats.promptMemory,
        [memoryKey]: updatePromptMemory(prev.stats.promptMemory[memoryKey], ok),
      };

      return {
        ...prev,
        stats: {
          ...prev.stats,
          total,
          byHand,
          byFacingHero,
          byFacingMatchup,
          byRfiPosition,
          mistakes,
          promptMemory,
        },
      };
    });

    if (ok) {
      setStatus('correct');
      scheduleNextPrompt();
    } else {
      setStatus('incorrect');
      isAnswerLockedRef.current = false;
    }
  };

  const sessionAccuracy = session.attempts === 0 ? 0 : (session.correct / session.attempts) * 100;
  const avgResponse = session.attempts === 0 ? 0 : session.totalResponseMs / session.attempts;

  const focusOptions =
    data.settings.drillType === 'rfi'
      ? RFI_POSITIONS
      : data.settings.drillType === 'three_bet'
        ? THREE_BET_HERO_POSITIONS
        : FACING_OPEN_HERO_POSITIONS;
  const selectedFocus =
    data.settings.drillType === 'rfi'
      ? data.settings.positionFocus.rfi
      : data.settings.drillType === 'three_bet'
        ? data.settings.positionFocus.three_bet
        : data.settings.positionFocus.facing_open;

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
          onDataChange((prev) => {
            const drillType = e.target.value as 'rfi' | 'facing_open' | 'three_bet';
            const nodeType = fromLegacyDrillType(drillType);
            return {
              ...prev,
              settings: {
                ...prev.settings,
                drillType,
                drillContext: {
                  ...prev.settings.drillContext,
                  nodeType,
                  villainPos: nodeType === 'rfi' ? undefined : prev.settings.facingOpenSelection.villainPos,
                },
              },
            };
          })
        }
      >
        <option value="rfi" disabled={!hasRfiData}>Open First In (RFI){!hasRfiData ? " (no data)" : ""}</option>
        <option value="facing_open" disabled={!hasFacingOpenData}>Facing an Open{!hasFacingOpenData ? " (no data)" : ""}</option>
        <option value="three_bet" disabled={!hasThreeBetData}>Facing a 3-bet{!hasThreeBetData ? " (no data)" : ""}</option>
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
                  const selected = [...list][0] as string | undefined;
                  if (selected) {
                    next.settings.drillContext.heroPos = selected as any;
                  }
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
        {(isFacingOpen || isThreeBet) && <p>{isThreeBet ? 'Facing 3-bet from' : 'Facing open from'}: {prompt.situation.villainPos}</p>}
        <p className="big-hand">{prompt.handClass}</p>
      </div>
      <div className="actions">
        {!policy ? (
          <p className="muted">No range data for this format/stack spot yet.</p>
        ) : isFacingOpen || isThreeBet ? (
          <>
            <button className="fold" onClick={() => answer('FOLD')}>
              FOLD
            </button>
            <button className="open" onClick={() => answer('CALL')}>
              CALL
            </button>
            <button className="primary" onClick={() => answer(isThreeBet ? '4BET' : '3BET')}>
              {isThreeBet ? '4BET' : '3BET'}
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
          actionColors={actionColors as any}
          testedHand={prompt.handClass}
          percentages={percentageText}
          onNext={stepNext}
        />
      )}
    </section>
  );
}
