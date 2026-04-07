import { cardToString } from './cards';
import type { DrillExplanation, DrillExplanationBullet, HandCategoryEvaluation, HandCategoryPrompt } from './types';

const LABELS: Record<string, string> = {
  'high-card': 'High Card',
  'one-pair': 'One Pair',
  'two-pair': 'Two Pair',
  trips: 'Trips',
  set: 'Set',
  straight: 'Straight',
  flush: 'Flush',
  'full-house': 'Full House',
  quads: 'Quads',
};

export const buildHandCategoryExplanation = (
  prompt: Omit<HandCategoryPrompt, 'explanation'>,
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

  if (evaluation.drawCategory && evaluation.drawCategory !== 'none') {
    bullets.push({ label: 'Draw', text: evaluation.drawCategory.replace('-', ' ') });
  } else if (evaluation.hasBackdoorFlushDraw || evaluation.hasBackdoorStraightDraw) {
    bullets.push({ label: 'Secondary', text: 'Backdoor draw potential present' });
  }

  return {
    summary: `You have ${LABELS[evaluation.category]}.`,
    bullets: bullets.slice(0, 3),
  };
};
