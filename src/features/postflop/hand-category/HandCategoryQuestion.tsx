import { cardToString } from '../../../domain/postflop/cards';
import type { HandCategoryAnswer, HandCategoryPrompt } from '../../../domain/postflop/types';
import { HAND_CATEGORY_OPTIONS } from './handCategoryOptions';

type Props = {
  prompt: HandCategoryPrompt;
  selected: HandCategoryAnswer | null;
  revealed: boolean;
  onAnswer: (answer: HandCategoryAnswer) => void;
};

export function HandCategoryQuestion({ prompt, selected, revealed, onAnswer }: Props) {
  return (
    <>
      <div className="card">
        <p>Hero: {prompt.heroHand.map(cardToString).join(' ')}</p>
        <p>Board: {prompt.board.map(cardToString).join(' ')}</p>
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
