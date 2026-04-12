import { useEffect, useMemo, useState } from 'react';
import { CardRow } from '../../../components/PlayingCard';
import {
  evaluateRangeNutQuizSelection,
  getEnabledRangeNutQuizSpots,
  getRangeNutQuizEntriesForSpot,
  nextPromptIndex,
  RANGE_NUT_MVP_SPOT_ID,
  shuffleRangeNutQuizEntries,
  type AdvantageAnswer,
} from '../../../domain/postflop/rangeNutAdvantageQuiz';
import { pickRandomPromptIndex } from '../../../domain/postflop/quizOrdering';
import { reduceDataOnRangeNutAnswer, reduceSessionOnRangeNutAnswer } from '../../../domain/postflop/rangeNutAdvantageStats';
import type { AppData, SessionStats } from '../../../lib/types';

const ANSWER_OPTIONS: Array<{ value: AdvantageAnswer; label: string }> = [
  { value: 'hero', label: 'Hero' },
  { value: 'villain', label: 'Villain' },
  { value: 'close', label: 'Close' },
];
const ANSWER_LABEL: Record<AdvantageAnswer, string> = {
  hero: 'Hero',
  villain: 'Villain',
  close: 'Close',
};

type Props = {
  data: AppData;
  session: SessionStats;
  onDataChange: (updater: (prev: AppData) => AppData) => void;
  onSessionChange: (updater: (prev: SessionStats) => SessionStats) => void;
  onOpenAnalyzer: () => void;
};

export function RangeNutAdvantagePage({ data, session, onDataChange, onSessionChange, onOpenAnalyzer }: Props) {
  const [spotId] = useState(RANGE_NUT_MVP_SPOT_ID);
  const [rangeSelection, setRangeSelection] = useState<AdvantageAnswer | null>(null);
  const [nutSelection, setNutSelection] = useState<AdvantageAnswer | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [questionStartTs, setQuestionStartTs] = useState(Date.now());

  const entries = useMemo(
    () => shuffleRangeNutQuizEntries(getRangeNutQuizEntriesForSpot(spotId)),
    [spotId],
  );
  const [promptIndex, setPromptIndex] = useState(() => pickRandomPromptIndex(entries.length));
  const prompt = entries[promptIndex];
  const selectedSpot = getEnabledRangeNutQuizSpots().find((spot) => spot.id === spotId);

  useEffect(() => {
    setPromptIndex(pickRandomPromptIndex(entries.length));
    setRangeSelection(null);
    setNutSelection(null);
    setRevealed(false);
    setQuestionStartTs(Date.now());
  }, [entries]);

  const canSubmit = rangeSelection !== null && nutSelection !== null && !revealed;

  const submit = () => {
    if (!prompt || !canSubmit || !rangeSelection || !nutSelection) return;
    const responseMs = Date.now() - questionStartTs;
    const evaluation = evaluateRangeNutQuizSelection(prompt, {
      rangeAdvantage: rangeSelection,
      nutAdvantage: nutSelection,
    });

    onSessionChange((prev) => reduceSessionOnRangeNutAnswer(prev, evaluation, responseMs));
    onDataChange((prev) => reduceDataOnRangeNutAnswer(prev, prompt, evaluation, responseMs));
    setRevealed(true);
  };

  const openAnalyzerForCurrentBoard = () => {
    if (!prompt || !selectedSpot) return;
    onDataChange((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        analyzer: {
          ...prev.settings.analyzer,
          format: selectedSpot.format,
          effectiveStackBb: selectedSpot.effectiveStackBb,
          openerPos: selectedSpot.openerPos,
          callerPos: selectedSpot.callerPos,
          spotId: toAnalyzerSpotId(selectedSpot),
          mode: 'range-vs-range',
          boardInputMode: 'exact',
          flop: prompt.board,
          exactHand: null,
          simplifiedPresetId: null,
        },
      },
    }));
    onOpenAnalyzer();
  };

  const next = () => {
    setPromptIndex((current) => {
      const nextIndex = nextPromptIndex(current, entries.length);
      if (nextIndex === 0 && entries.length > 1) {
        setEntries((prev) => shuffleRangeNutQuizEntries(prev));
      }
      return nextIndex;
    });
    setRangeSelection(null);
    setNutSelection(null);
    setRevealed(false);
    setQuestionStartTs(Date.now());
  };

  const revealedEval = prompt && revealed && rangeSelection && nutSelection
    ? evaluateRangeNutQuizSelection(prompt, {
      rangeAdvantage: rangeSelection,
      nutAdvantage: nutSelection,
    })
    : null;

  const historical = data.stats.postflop.rangeNutAdvantage;
  const sessionStats = session.postflop.rangeNutAdvantage;
  const formatPct = (correct: number, attempts: number) => (attempts === 0 ? '0.0%' : `${((correct / attempts) * 100).toFixed(1)}%`);

  if (!prompt) {
    return <p className="muted">No quiz prompts found for this spot.</p>;
  }

  return (
    <>
      <h3>Postflop: Range / Nut Advantage</h3>
      <p className="muted">Quiz scope: flop only • accepted curated library</p>
      <p className="session">
        Historical full accuracy: {historical.fullyCorrect}/{historical.attempts} ({formatPct(historical.fullyCorrect, historical.attempts)})
        {' '}• Session: {sessionStats.fullyCorrect}/{sessionStats.attempts}
      </p>

      <div className="card">
        <p><strong>Spot:</strong> {selectedSpot?.label ?? 'BTN vs BB SRP (Flop)'}</p>
        <p><strong>Board #:</strong> {promptIndex + 1} / {entries.length}</p>
        <p><strong>Context:</strong> Hero = preflop opener (BTN), Villain = caller (BB)</p>
        <p><strong>Board:</strong> <CardRow cards={prompt.board} size="md" label="Flop board" /></p>
      </div>

      <div className="card">
        <p><strong>Who has range advantage?</strong></p>
        <div className="actions postflop-actions">
          {ANSWER_OPTIONS.map((option) => (
            <button
              key={`range-${option.value}`}
              className={rangeSelection === option.value ? 'primary' : ''}
              disabled={revealed}
              onClick={() => setRangeSelection(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <p><strong>Who has nut advantage?</strong></p>
        <div className="actions postflop-actions">
          {ANSWER_OPTIONS.map((option) => (
            <button
              key={`nut-${option.value}`}
              className={nutSelection === option.value ? 'primary' : ''}
              disabled={revealed}
              onClick={() => setNutSelection(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {!revealed ? (
          <button className="primary" disabled={!canSubmit} onClick={submit}>Submit answer</button>
        ) : (
          <div className="feedback">
            <p><strong>Range advantage:</strong> {revealedEval?.rangeCorrect ? '✅ Correct' : `❌ Incorrect (correct: ${ANSWER_LABEL[prompt.rangeAdvantage]})`}</p>
            <p><strong>Nut advantage:</strong> {revealedEval?.nutCorrect ? '✅ Correct' : `❌ Incorrect (correct: ${ANSWER_LABEL[prompt.nutAdvantage]})`}</p>
            <p>{prompt.explanation.summary}</p>
            {prompt.explanation.tags.length > 0 && (
              <p className="muted">{prompt.explanation.tags.join(' • ')}</p>
            )}
            {prompt.familyTags.length > 0 && (
              <p className="muted">Board texture: {prompt.familyTags.join(', ')}</p>
            )}
            <button onClick={openAnalyzerForCurrentBoard}>Open board in Analyzer</button>
            <button className="primary" onClick={next}>Next board</button>
          </div>
        )}
      </div>
    </>
  );
}
