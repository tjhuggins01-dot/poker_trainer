import { buildPromptMemoryKey, updatePromptMemory } from '../../lib/logic';
import type {
  AppData,
  DrillAction,
  FacingOpenHeroPosition,
  HandClass,
  RfiPosition,
  SessionStats,
  Situation,
} from '../../lib/types';

type SessionReduceAnswerInput = {
  situation: Situation;
  isCorrect: boolean;
  responseMs: number;
};

type AppDataReduceAnswerInput = {
  situation: Situation;
  handClass: HandClass;
  expectedAction: DrillAction;
  policyKey: string;
  isCorrect: boolean;
  nowTs?: number;
};

export const reduceSessionOnAnswer = (
  prev: SessionStats,
  { situation, isCorrect, responseMs }: SessionReduceAnswerInput,
): SessionStats => {
  const next = structuredClone(prev);
  next.attempts += 1;
  next.totalResponseMs += responseMs;

  if (situation.facingAction === 'open') {
    const hero = situation.heroPos as FacingOpenHeroPosition;
    next.byFacingHero[hero].attempts += 1;
    if (isCorrect) next.byFacingHero[hero].correct += 1;
  } else {
    const hero = situation.heroPos as RfiPosition;
    next.byRfiPosition[hero].attempts += 1;
    if (isCorrect) next.byRfiPosition[hero].correct += 1;
  }

  if (isCorrect) next.correct += 1;
  return next;
};

export const reduceAppDataStatsOnAnswer = (
  prev: AppData,
  {
    situation,
    handClass,
    expectedAction,
    policyKey,
    isCorrect,
    nowTs = Date.now(),
  }: AppDataReduceAnswerInput,
): AppData => {
  const byHandEntry = prev.stats.byHand[handClass] ?? { attempts: 0, correct: 0 };
  const byHand = {
    ...prev.stats.byHand,
    [handClass]: {
      attempts: byHandEntry.attempts + 1,
      correct: byHandEntry.correct + (isCorrect ? 1 : 0),
    },
  };

  const total = {
    attempts: prev.stats.total.attempts + 1,
    correct: prev.stats.total.correct + (isCorrect ? 1 : 0),
  };

  let byFacingHero = prev.stats.byFacingHero;
  let byFacingMatchup = prev.stats.byFacingMatchup;
  let byRfiPosition = prev.stats.byRfiPosition;

  if (situation.facingAction === 'open') {
    const hero = situation.heroPos as FacingOpenHeroPosition;
    const matchup = `${situation.heroPos}vs${situation.villainPos}`;
    const heroEntry = prev.stats.byFacingHero[hero];
    const matchupEntry = prev.stats.byFacingMatchup[matchup] ?? { attempts: 0, correct: 0 };

    byFacingHero = {
      ...prev.stats.byFacingHero,
      [hero]: {
        attempts: heroEntry.attempts + 1,
        correct: heroEntry.correct + (isCorrect ? 1 : 0),
      },
    };

    byFacingMatchup = {
      ...prev.stats.byFacingMatchup,
      [matchup]: {
        attempts: matchupEntry.attempts + 1,
        correct: matchupEntry.correct + (isCorrect ? 1 : 0),
      },
    };
  } else {
    const hero = situation.heroPos as RfiPosition;
    const heroEntry = prev.stats.byRfiPosition[hero];
    byRfiPosition = {
      ...prev.stats.byRfiPosition,
      [hero]: {
        attempts: heroEntry.attempts + 1,
        correct: heroEntry.correct + (isCorrect ? 1 : 0),
      },
    };
  }

  const mistakes = !isCorrect
    ? (() => {
        const mKey =
          situation.facingAction === 'open'
            ? `${situation.heroPos}vs${situation.villainPos}|${handClass}|${expectedAction}`
            : `${situation.heroPos}|${handClass}|${expectedAction}`;
        const prevEntry = prev.stats.mistakes[mKey] ?? { count: 0, lastTs: 0 };
        return {
          ...prev.stats.mistakes,
          [mKey]: {
            count: prevEntry.count + 1,
            lastTs: nowTs,
          },
        };
      })()
    : prev.stats.mistakes;

  const memoryKey = buildPromptMemoryKey(policyKey, handClass);
  const promptMemory = {
    ...prev.stats.promptMemory,
    [memoryKey]: updatePromptMemory(prev.stats.promptMemory[memoryKey], isCorrect),
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
};
