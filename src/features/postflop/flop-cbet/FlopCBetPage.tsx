import { useMemo, useState } from 'react';
import { CardRow } from '../../../components/PlayingCard';
import {
  evaluateFlopCBetSelection,
  FLOP_CBET_MVP_SPOT_ID,
  getAcceptedFlopCBetEntriesForSpot,
  getEnabledFlopCBetSpots,
  nextFlopCBetPromptIndex,
  type CBetAction,
} from '../../../domain/postflop/flopCBetTrainer';
import { reduceDataOnFlopCBetAnswer, reduceSessionOnFlopCBetAnswer } from '../../../domain/postflop/flopCBetStats';
import type { AppData, SessionStats } from '../../../lib/types';

const ANSWER_OPTIONS: Array<{ value: CBetAction; label: string }> = [
  { value: 'check', label: 'Check' },
  { value: 'bet-small', label: 'Bet Small' },
  { value: 'bet-big', label: 'Bet Big' },
];

const ANSWER_LABEL: Record<CBetAction, string> = {
  check: 'Check',
  'bet-small': 'Bet Small',
  'bet-big': 'Bet Big',
};

type Props = {
  data: AppData;
  session: SessionStats;
  onDataChange: (updater: (prev: AppData) => AppData) => void;
  onSessionChange: (updater: (prev: SessionStats) => SessionStats) => void;
};

export function FlopCBetPage({ data, session, onDataChange, onSessionChange }: Props) {
  const [spotId] = useState(FLOP_CBET_MVP_SPOT_ID);
  const [promptIndex, setPromptIndex] = useState(0);
  const [selection, setSelection] = useState<CBetAction | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [questionStartTs, setQuestionStartTs] = useState(Date.now());

  const entries = useMemo(() => getAcceptedFlopCBetEntriesForSpot(spotId), [spotId]);
  const prompt = entries[promptIndex];
  const selectedSpot = getEnabledFlopCBetSpots().find((spot) => spot.id === spotId);

  const canSubmit = selection !== null && !revealed;

  const submit = () => {
    if (!prompt || !selection || !canSubmit) return;
    const responseMs = Date.now() - questionStartTs;
    const evaluation = evaluateFlopCBetSelection(prompt, selection);
    onSessionChange((prev) => reduceSessionOnFlopCBetAnswer(prev, evaluation, responseMs));
    onDataChange((prev) => reduceDataOnFlopCBetAnswer(prev, prompt, evaluation, responseMs));
    setRevealed(true);
  };

  const next = () => {
    setPromptIndex((current) => nextFlopCBetPromptIndex(current, entries.length));
    setSelection(null);
    setRevealed(false);
    setQuestionStartTs(Date.now());
  };

  const revealedEval = prompt && selection && revealed ? evaluateFlopCBetSelection(prompt, selection) : null;

  const historical = data.stats.postflop.flopCBet;
  const sessionStats = session.postflop.flopCBet;
  const formatPct = (correct: number, attempts: number) => (attempts === 0 ? '0.0%' : `${((correct / attempts) * 100).toFixed(1)}%`);

  if (!prompt || !prompt.cBetExplanation || !prompt.recommendedCBetAction) {
    return <p className="muted">No c-bet prompts found for this spot.</p>;
  }

  return (
    <>
      <h3>Postflop: Flop C-Bet</h3>
      <p className="muted">Quiz scope: BTN vs BB SRP • flop only • board-level baseline action</p>
      <p className="session">
        Historical accuracy: {historical.correct}/{historical.attempts} ({formatPct(historical.correct, historical.attempts)})
        {' '}• Session: {sessionStats.correct}/{sessionStats.attempts}
      </p>

      <div className="card">
        <p><strong>Spot:</strong> {selectedSpot?.label ?? 'BTN vs BB SRP (Flop)'}</p>
        <p><strong>Board #:</strong> {promptIndex + 1} / {entries.length}</p>
        <p><strong>Context:</strong> Hero = preflop raiser (BTN), Villain = caller (BB)</p>
        <p><strong>Board:</strong> <CardRow cards={prompt.board} size="md" label="Flop board" /></p>
      </div>

      <div className="card">
        <p><strong>Best simplified baseline action?</strong></p>
        <div className="actions postflop-actions">
          {ANSWER_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={selection === option.value ? 'primary' : ''}
              disabled={revealed}
              onClick={() => setSelection(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {!revealed ? (
          <button className="primary" disabled={!canSubmit} onClick={submit}>Submit answer</button>
        ) : (
          <div className="feedback">
            <p>{revealedEval?.correct ? '✅ Correct' : '❌ Incorrect'}</p>
            <p><strong>Your answer:</strong> {selection ? ANSWER_LABEL[selection] : '-'}</p>
            <p><strong>Correct answer:</strong> {ANSWER_LABEL[prompt.recommendedCBetAction]}</p>
            <p>{prompt.cBetExplanation.summary}</p>
            <p className="muted">
              Range advantage: {prompt.rangeAdvantage} • Nut advantage: {prompt.nutAdvantage}
            </p>
            {prompt.cBetTags && prompt.cBetTags.length > 0 && (
              <p className="muted">{prompt.cBetTags.join(' • ')}</p>
            )}
            {prompt.cBetExplanation.tags.length > 0 && (
              <p className="muted">{prompt.cBetExplanation.tags.join(' • ')}</p>
            )}
            <button className="primary" onClick={next}>Next board</button>
          </div>
        )}
      </div>
    </>
  );
}
