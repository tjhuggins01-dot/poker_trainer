import type { HandCategoryAnswer } from './types';

export const isMadeHand = (category: HandCategoryAnswer): boolean => category !== 'high-card';
