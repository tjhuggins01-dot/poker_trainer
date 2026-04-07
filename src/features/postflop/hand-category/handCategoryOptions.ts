import type { HandCategoryAnswer } from '../../../domain/postflop/types';
import { HAND_CATEGORY_LABELS } from '../../../lib/postflop/constants';

export const HAND_CATEGORY_OPTIONS = (Object.keys(HAND_CATEGORY_LABELS) as HandCategoryAnswer[]).map((value) => ({
  value,
  label: HAND_CATEGORY_LABELS[value],
}));
