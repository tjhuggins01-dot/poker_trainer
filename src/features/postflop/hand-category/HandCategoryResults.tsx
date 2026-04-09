import { HAND_CATEGORY_LABELS } from '../../../lib/postflop/constants';
import type { StreetPrompt } from '../../../domain/postflop/types';

type Props = {
  prompt: StreetPrompt;
  onNext: () => void;
  isFinalStreet: boolean;
};

export function HandCategoryResults({ prompt, onNext, isFinalStreet }: Props) {
  return (
    <div className="feedback">
      <p>Correct: {HAND_CATEGORY_LABELS[prompt.correctAnswer]}</p>
      <p>{prompt.explanation.summary}</p>
      <ul>
        {prompt.explanation.bullets.map((bullet) => (
          <li key={`${bullet.label}-${bullet.text}`}>
            <strong>{bullet.label}:</strong> {bullet.text}
          </li>
        ))}
      </ul>
      <button className="primary" onClick={onNext}>{isFinalStreet ? 'Next hand' : 'Next street'}</button>
    </div>
  );
}
