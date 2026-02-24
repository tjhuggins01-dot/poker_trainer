import { useEffect, useRef, useState } from 'react';
import { computeCorrectAction, getPromptSignature, nextPrompt } from '../../../lib/logic';
import { reduceAppDataStatsOnAnswer, reduceSessionOnAnswer } from '../../../domain/stats/reducers';
import { policyKeyFromSituation } from '../../../domain/policy/resolver';
import type { AppData, DrillAction, SessionStats } from '../../../lib/types';

type OnDataChange = (updater: (prev: AppData) => AppData) => void;
type OnSessionChange = (updater: (prev: SessionStats) => SessionStats) => void;

type Params = {
  data: AppData;
  weightedMap: ReturnType<typeof import('../../../lib/logic').buildWeightedHandMap>;
  drillResetKey: string;
  onDataChange: OnDataChange;
  onSessionChange: OnSessionChange;
};

export function usePromptCycle({
  data,
  weightedMap,
  drillResetKey,
  onDataChange,
  onSessionChange,
}: Params) {
  const [prompt, setPrompt] = useState(() => nextPrompt(data, weightedMap));
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [correctAction, setCorrectAction] = useState<DrillAction>('FOLD');
  const [questionStartTs, setQuestionStartTs] = useState(() => Date.now());

  const nextPromptTimeoutRef = useRef<number | null>(null);
  const isAnswerLockedRef = useRef(false);
  const recentPromptSignaturesRef = useRef<string[]>([]);

  const clearNextPromptTimeout = () => {
    if (nextPromptTimeoutRef.current === null) return;
    window.clearTimeout(nextPromptTimeoutRef.current);
    nextPromptTimeoutRef.current = null;
  };

  const cancelAndResetDrillState = () => {
    clearNextPromptTimeout();
    isAnswerLockedRef.current = false;
    setStatus('idle');
    setQuestionStartTs(Date.now());
  };

  const pickNextPrompt = (currentPrompt = prompt) => {
    const recent = recentPromptSignaturesRef.current;
    const withCurrent = [
      ...recent,
      getPromptSignature(currentPrompt.situation, currentPrompt.handClass),
    ];
    const next = nextPrompt(data, weightedMap, withCurrent);
    const nextSignature = getPromptSignature(next.situation, next.handClass);
    recentPromptSignaturesRef.current = [...withCurrent, nextSignature].slice(-4);
    return next;
  };

  const stepNext = () => {
    cancelAndResetDrillState();
    setPrompt(pickNextPrompt());
  };

  const scheduleNextPrompt = (delayMs = 300) => {
    clearNextPromptTimeout();
    nextPromptTimeoutRef.current = window.setTimeout(() => {
      nextPromptTimeoutRef.current = null;
      stepNext();
    }, delayMs);
  };

  const answer = (action: DrillAction) => {
    if (isAnswerLockedRef.current || status !== 'idle') return;
    isAnswerLockedRef.current = true;

    const expected = computeCorrectAction(data, prompt.situation, prompt.handClass);
    const ok = action === expected;
    setCorrectAction(expected);
    const responseMs = Date.now() - questionStartTs;

    onSessionChange((prev) =>
      reduceSessionOnAnswer(prev, {
        situation: prompt.situation,
        isCorrect: ok,
        responseMs,
      }),
    );

    onDataChange((prev) =>
      reduceAppDataStatsOnAnswer(prev, {
        situation: prompt.situation,
        handClass: prompt.handClass,
        expectedAction: expected,
        policyKey: policyKeyFromSituation(
          prompt.situation,
          data.settings.drillContext.format,
          data.settings.drillContext.effectiveStackBb,
        ),
        isCorrect: ok,
      }),
    );

    if (ok) {
      setStatus('correct');
      scheduleNextPrompt();
    } else {
      setStatus('incorrect');
      isAnswerLockedRef.current = false;
    }
  };

  useEffect(() => () => clearNextPromptTimeout(), []);

  useEffect(() => {
    cancelAndResetDrillState();
    recentPromptSignaturesRef.current = [];
    const freshPrompt = nextPrompt(data, weightedMap);
    recentPromptSignaturesRef.current = [getPromptSignature(freshPrompt.situation, freshPrompt.handClass)];
    setPrompt(freshPrompt);
  }, [drillResetKey]);

  return {
    prompt,
    status,
    correctAction,
    stepNext,
    answer,
  };
}
