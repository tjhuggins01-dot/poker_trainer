import { useMemo, useState } from 'react';
import { generateHandCategorySequencePrompt } from '../../../domain/postflop/generators';
import { buildPostflopFingerprint, getPostflopMistakeTags } from '../../../domain/postflop/stats';
import { nextStreet, shouldShowStreetFeedback } from '../../../domain/postflop/sessionFlow';
import type { HandCategoryAnswer, Street } from '../../../domain/postflop/types';
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
  const [prompt, setPrompt] = useState(() => generateHandCategorySequencePrompt('medium', 'initial'));
  const [street, setStreet] = useState<Street>('flop');
  const [selected, setSelected] = useState<HandCategoryAnswer | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [questionStartTs, setQuestionStartTs] = useState(Date.now());

  const streetPrompt = prompt.streets[street];

  const accuracy = useMemo(() => {
    const stats = data.stats.postflop.handCategory;
    return stats.totalAnswered === 0 ? '0.0%' : `${((stats.correct / stats.totalAnswered) * 100).toFixed(1)}%`;
  }, [data.stats.postflop.handCategory]);

  const advanceStreetOrHand = () => {
    const upcomingStreet = nextStreet(street);
    if (upcomingStreet) {
      setStreet(upcomingStreet);
      setSelected(null);
      setRevealed(false);
      setQuestionStartTs(Date.now());
      return;
    }

    setPrompt(generateHandCategorySequencePrompt('medium', `${Date.now()}`));
    setStreet('flop');
    setSelected(null);
    setRevealed(false);
    setQuestionStartTs(Date.now());
  };

  const answer = (choice: HandCategoryAnswer) => {
    if (revealed) return;
    const isCorrect = choice === streetPrompt.correctAnswer;
    const responseMs = Date.now() - questionStartTs;
    setSelected(choice);

    onSessionChange((prev) => ({
      ...prev,
      attempts: prev.attempts + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
      totalResponseMs: prev.totalResponseMs + responseMs,
      byDrill: {
        ...prev.byDrill,
        postflop_hand_category: {
          attempts: prev.byDrill.postflop_hand_category.attempts + 1,
          correct: prev.byDrill.postflop_hand_category.correct + (isCorrect ? 1 : 0),
        },
      },
      byDrillResponseMs: {
        ...prev.byDrillResponseMs,
        postflop_hand_category: prev.byDrillResponseMs.postflop_hand_category + responseMs,
      },
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
      const fingerprint = buildPostflopFingerprint(streetPrompt.correctAnswer);
      return {
        ...prev,
        stats: {
          ...prev.stats,
          total: {
            attempts: prev.stats.total.attempts + 1,
            correct: prev.stats.total.correct + (isCorrect ? 1 : 0),
          },
          byDrill: {
            ...prev.stats.byDrill,
            postflop_hand_category: {
              attempts: prev.stats.byDrill.postflop_hand_category.attempts + 1,
              correct: prev.stats.byDrill.postflop_hand_category.correct + (isCorrect ? 1 : 0),
            },
          },
          byDrillResponseMs: {
            ...prev.stats.byDrillResponseMs,
            postflop_hand_category: prev.stats.byDrillResponseMs.postflop_hand_category + responseMs,
          },
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
                    [streetPrompt.correctAnswer]: (current.missedByCategory[streetPrompt.correctAnswer] ?? 0) + 1,
                  },
              missedFingerprints: isCorrect
                ? current.missedFingerprints
                : {
                    ...current.missedFingerprints,
                    [fingerprint]: (current.missedFingerprints[fingerprint] ?? 0) + 1,
                  },
              mistakeTags: isCorrect
                ? current.mistakeTags
                : getPostflopMistakeTags(streetPrompt.correctAnswer, choice).reduce(
                    (acc, tag) => ({ ...acc, [tag]: (acc[tag] ?? 0) + 1 }),
                    current.mistakeTags,
                  ),
            },
          },
        },
      };
    });

    if (!shouldShowStreetFeedback(isCorrect, data.settings.showCorrectAnswerFeedback)) {
      advanceStreetOrHand();
      return;
    }

    setRevealed(true);
  };

  return (
    <>
      <h3>Postflop: Hand Category</h3>
      <p className="session">
        Postflop accuracy: {data.stats.postflop.handCategory.correct}/{data.stats.postflop.handCategory.totalAnswered} ({accuracy})
        {' '}• Session: {session.byDrill.postflop_hand_category.correct}/{session.byDrill.postflop_hand_category.attempts}
      </p>
      <HandCategoryQuestion heroHand={prompt.heroHand} prompt={streetPrompt} selected={selected} revealed={revealed} onAnswer={answer} />
      {revealed && <HandCategoryResults prompt={streetPrompt} onNext={advanceStreetOrHand} isFinalStreet={street === 'river'} />}
    </>
  );
}
