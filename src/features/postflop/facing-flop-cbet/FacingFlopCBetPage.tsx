import { useEffect, useState } from 'react';
import { CardRow } from '../../../components/PlayingCard';
import {
  evaluateFacingFlopCBetSelection,
  FACING_FLOP_CBET_MVP_SPOT_ID,
  getEnabledFacingFlopCBetSpots,
  getFacingFlopCBetAcceptedPromptsForSpot,
  nextFacingFlopCBetPromptIndex,
  shuffleFacingFlopCBetPrompts,
  type FacingFlopCBetPrompt,
  type FacingFlopCBetResponse,
} from '../../../domain/postflop/facingFlopCBetTrainer';
import {
  reduceDataOnFacingFlopCBetAnswer,
  reduceSessionOnFacingFlopCBetAnswer,
} from '../../../domain/postflop/facingFlopCBetStats';
import { pickRandomPromptIndex } from '../../../domain/postflop/quizOrdering';
import type { AppData, SessionStats } from '../../../lib/types';

const ANSWER_OPTIONS: Array<{ value: FacingFlopCBetResponse; label: string }> = [
  { value: 'fold', label: 'Fold' },
  { value: 'call', label: 'Call' },
  { value: 'raise', label: 'Raise' },
];

const ANSWER_LABEL: Record<FacingFlopCBetResponse, string> = {
  fold: 'Fold',
  call: 'Call',
  raise: 'Raise',
};

type Props = {
  data: AppData;
  session: SessionStats;
  onDataChange: (updater: (prev: AppData) => AppData) => void;
  onSessionChange: (updater: (prev: SessionStats) => SessionStats) => void;
};

export function FacingFlopCBetPage({ data, session, onDataChange, onSessionChange }: Props) {
  const [spotId] = useState(FACING_FLOP_CBET_MVP_SPOT_ID);
  const [selection, setSelection] = useState<FacingFlopCBetResponse | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [questionStartTs, setQuestionStartTs] = useState(Date.now());
  const [prompts, setPrompts] = useState<FacingFlopCBetPrompt[]>(() =>
    shuffleFacingFlopCBetPrompts(getFacingFlopCBetAcceptedPromptsForSpot(spotId)),
  );

  const [promptIndex, setPromptIndex] = useState(() => pickRandomPromptIndex(prompts.length));
  const prompt = prompts[promptIndex];
  const selectedSpot = getEnabledFacingFlopCBetSpots().find((spot) => spot.id === spotId);

  useEffect(() => {
    setPrompts(shuffleFacingFlopCBetPrompts(getFacingFlopCBetAcceptedPromptsForSpot(spotId)));
  }, [spotId]);

  useEffect(() => {
    setPromptIndex(pickRandomPromptIndex(prompts.length));
    setSelection(null);
    setRevealed(false);
    setQuestionStartTs(Date.now());
  }, [prompts]);

  const canSubmit = selection !== null && !revealed;

  const submit = () => {
    if (!prompt || !selection || !canSubmit) return;
    const responseMs = Date.now() - questionStartTs;
    const evaluation = evaluateFacingFlopCBetSelection(prompt, selection);
    onSessionChange((prev) => reduceSessionOnFacingFlopCBetAnswer(prev, evaluation, responseMs));
    onDataChange((prev) => reduceDataOnFacingFlopCBetAnswer(prev, prompt, evaluation, responseMs));
    setRevealed(true);
  };

  const next = () => {
    setPromptIndex((current) => nextFacingFlopCBetPromptIndex(current, prompts.length));
    setSelection(null);
    setRevealed(false);
    setQuestionStartTs(Date.now());
  };

  const revealedEval = prompt && selection && revealed ? evaluateFacingFlopCBetSelection(prompt, selection) : null;
  const historical = data.stats.postflop.facingFlopCBet;
  const sessionStats = session.postflop.facingFlopCBet;
  const formatPct = (correct: number, attempts: number) => (attempts === 0 ? '0.0%' : `${((correct / attempts) * 100).toFixed(1)}%`);

  if (!prompt) return <p className="muted">No facing flop c-bet prompts found for this spot.</p>;

  return (
    <>
      <h3>Postflop: Facing Flop C-Bet</h3>
      <p className="muted">Quiz scope: BTN vs CO SRP • hero called preflop • in position vs flop c-bet • hand-level</p>
      <p className="session">
        Historical accuracy: {historical.correct}/{historical.attempts} ({formatPct(historical.correct, historical.attempts)})
        {' '}• Session: {sessionStats.correct}/{sessionStats.attempts}
      </p>

      <div className="card">
        <p><strong>Spot:</strong> {selectedSpot?.label ?? 'BTN vs CO SRP'}</p>
        <p><strong>Prompt #:</strong> {promptIndex + 1} / {prompts.length}</p>
        <p><strong>Context:</strong> Hero = BTN caller in position, Villain = CO preflop raiser and flop c-bettor</p>
        <p><strong>Hero hand:</strong> <CardRow cards={prompt.heroHand} size="md" label="Hero hand" /></p>
        <p><strong>Flop:</strong> <CardRow cards={prompt.board} size="md" label="Flop board" /></p>
        <p><strong>Pot:</strong> {prompt.potSizeBb}bb • <strong>Bet:</strong> {prompt.cBetSizeBb}bb ({prompt.cBetSizeBucket})</p>
      </div>

      <div className="card">
        <p><strong>Best simplified response facing this c-bet?</strong></p>
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
            <p><strong>Correct answer:</strong> {ANSWER_LABEL[prompt.recommendedResponse]}</p>
            <p>{prompt.explanation.summary}</p>
            {prompt.explanation.bullets.length > 0 && (
              <ul>
                {prompt.explanation.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            )}
            <p className="muted">{prompt.explanation.tags.join(' • ')}</p>
            <button className="primary" onClick={next}>Next prompt</button>
          </div>
        )}
      </div>
    </>
  );
}
