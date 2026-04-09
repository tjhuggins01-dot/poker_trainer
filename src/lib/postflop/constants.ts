import type { HandCategoryAnswer } from '../../domain/postflop/types';

export const HAND_CATEGORY_LABELS: Record<HandCategoryAnswer, string> = {
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
