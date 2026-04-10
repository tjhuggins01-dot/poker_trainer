import type { HandCategoryAnswer, HoleCards, StreetPrompt } from '../../../domain/postflop/types';
import { HAND_CATEGORY_OPTIONS } from './handCategoryOptions';
import { CardRow } from '../../../components/PlayingCard';

type Props = {
  heroHand: HoleCards;
  prompt: StreetPrompt;
  selected: HandCategoryAnswer | null;
  revealed: boolean;
  onAnswer: (answer: HandCategoryAnswer) => void;
};

export function HandCategoryQuestion({ heroHand, prompt, selected, revealed, onAnswer }: Props) {
  return (
    <>
      <div className="card">
        <p>Street: {prompt.street.toUpperCase()}</p>
        <p>Hero: <CardRow cards={heroHand} label="Hero hand" /></p>
        <p>Board: <CardRow cards={prompt.board} label="Board" /></p>
        <p>What is your hand category?</p>
      </div>
      <div className="actions postflop-actions">
        {HAND_CATEGORY_OPTIONS.map((option) => {
          const isCorrect = revealed && option.value === prompt.correctAnswer;
          const isWrongSelected = revealed && selected === option.value && selected !== prompt.correctAnswer;
          return (
            <button
              key={option.value}
              onClick={() => onAnswer(option.value)}
              disabled={revealed}
              className={isCorrect ? 'primary' : isWrongSelected ? 'danger' : ''}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
