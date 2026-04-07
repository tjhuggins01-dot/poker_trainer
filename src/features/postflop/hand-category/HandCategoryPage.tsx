import { useMemo, useState } from 'react';
import { generateHandCategoryPrompt } from '../../../domain/postflop/generators';
import { buildPostflopFingerprint, getPostflopMistakeTags } from '../../../domain/postflop/stats';
import type { HandCategoryAnswer } from '../../../domain/postflop/types';
import type { AppData, SessionStats } from '../../../lib/types';
import { HandCategoryQuestion } from './HandCategoryQuestion';
import { HandCategoryResults } from './HandCategoryResults';

type Props = {
  data: AppData;
  session: SessionStats;
  onDataChange: (updater: (prev: AppData) => AppData) => void;
  onSessionChange: (updater: (prev: SessionStats) => SessionStats) => void;
};

export function HandCategoryPage({ data, session, onDataChange, onSessionChange }: Props) {
  const [prompt, setPrompt] = useState(() => generateHandCategoryPrompt('medium', 'initial'));
  const [selected, setSelected] = useState<HandCategoryAnswer | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [questionStartTs, setQuestionStartTs] = useState(Date.now());

  const accuracy = useMemo(() => {
    const stats = data.stats.postflop.handCategory;
    return stats.totalAnswered === 0 ? '0.0%' : `${((stats.correct / stats.totalAnswered) * 100).toFixed(1)}%`;
  }, [data.stats.postflop.handCategory]);

  const answer = (choice: HandCategoryAnswer) => {
    if (revealed) return;
    const isCorrect = choice === prompt.correctAnswer;
    const responseMs = Date.now() - questionStartTs;
    setSelected(choice);
    setRevealed(true);

    onSessionChange((prev) => ({
      ...prev,
      attempts: prev.attempts + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
      totalResponseMs: prev.totalResponseMs + responseMs,
      postflop: {
        ...prev.postflop,
        handCategory: {
          ...prev.postflop.handCategory,
          attempts: prev.postflop.handCategory.attempts + 1,
          correct: prev.postflop.handCategory.correct + (isCorrect ? 1 : 0),
          totalResponseMs: prev.postflop.handCategory.totalResponseMs + responseMs,
        },
      },
    }));

    onDataChange((prev) => {
      const current = prev.stats.postflop.handCategory;
      const fingerprint = buildPostflopFingerprint(prompt.correctAnswer);
      return {
        ...prev,
        stats: {
          ...prev.stats,
          postflop: {
            ...prev.stats.postflop,
            handCategory: {
              ...current,
              totalAnswered: current.totalAnswered + 1,
              correct: current.correct + (isCorrect ? 1 : 0),
              totalResponseMs: current.totalResponseMs + responseMs,
              missedByCategory: isCorrect
                ? current.missedByCategory
                : {
                    ...current.missedByCategory,
                    [prompt.correctAnswer]: (current.missedByCategory[prompt.correctAnswer] ?? 0) + 1,
                  },
              missedFingerprints: isCorrect
                ? current.missedFingerprints
                : {
                    ...current.missedFingerprints,
                    [fingerprint]: (current.missedFingerprints[fingerprint] ?? 0) + 1,
                  },
              mistakeTags: isCorrect
                ? current.mistakeTags
                : getPostflopMistakeTags(prompt.correctAnswer, choice).reduce(
                    (acc, tag) => ({ ...acc, [tag]: (acc[tag] ?? 0) + 1 }),
                    current.mistakeTags,
                  ),
            },
          },
        },
      };
    });
  };

  const next = () => {
    setPrompt(generateHandCategoryPrompt('medium', `${Date.now()}`));
    setSelected(null);
    setRevealed(false);
    setQuestionStartTs(Date.now());
  };

  return (
    <>
      <h3>Postflop: Hand Category</h3>
      <p className="session">
        Postflop accuracy: {data.stats.postflop.handCategory.correct}/{data.stats.postflop.handCategory.totalAnswered} ({accuracy})
        {' '}• Session: {session.postflop.handCategory.correct}/{session.postflop.handCategory.attempts}
      </p>
      <HandCategoryQuestion prompt={prompt} selected={selected} revealed={revealed} onAnswer={answer} />
      {revealed && <HandCategoryResults prompt={prompt} onNext={next} />}
    </>
  );
}
