import type { HandCategoryAnswer, PostflopMistakeTag } from './types';

export const buildPostflopFingerprint = (category: HandCategoryAnswer): string => `cat:${category}`;

export const getPostflopMistakeTags = (correct: HandCategoryAnswer, selected: HandCategoryAnswer): PostflopMistakeTag[] => {
  if (correct === selected) return [];
  if (correct === 'one-pair' && selected === 'high-card') return ['misread-pair-strength'];
  return ['misread-made-hand'];
};
