import { cardToString } from './cards';
import type { Card, DrillExplanation, DrillExplanationBullet, HandCategoryEvaluation, HoleCards } from './types';

const LABELS: Record<string, string> = {
  'high-card': 'High Card',
  'one-pair': 'One Pair',
  'two-pair': 'Two Pair',
  trips: 'Trips',
  straight: 'Straight',
  flush: 'Flush',
  'full-house': 'Full House',
  quads: 'Quads',
  'straight-flush': 'Straight Flush',
};

export const buildHandCategoryExplanation = (
  prompt: { heroHand: HoleCards; board: Card[] },
  evaluation: HandCategoryEvaluation,
): DrillExplanation => {
  const bullets: DrillExplanationBullet[] = [];
  bullets.push({
    label: 'Cards',
    text: `Hero ${prompt.heroHand.map(cardToString).join(' ')} on ${prompt.board.map(cardToString).join(' ')}`,
  });

  if (evaluation.pairSubtype) {
    bullets.push({ label: 'Pair detail', text: evaluation.pairSubtype.replace('-', ' ') });
  }

  if (prompt.board.length === 3 && evaluation.drawCategory && evaluation.drawCategory !== 'none') {
    bullets.push({ label: 'Draw', text: evaluation.drawCategory.replace('-', ' ') });
  }

  return {
    summary: `You have ${LABELS[evaluation.category]}.`,
    bullets: bullets.slice(0, 3),
  };
};
