import type { Street } from './types';

const STREET_ORDER: Street[] = ['flop', 'turn', 'river'];

export const shouldShowStreetFeedback = (isCorrect: boolean, showCorrectAnswerFeedback: boolean): boolean =>
  !isCorrect || showCorrectAnswerFeedback;

export const nextStreet = (street: Street): Street | null => {
  const index = STREET_ORDER.indexOf(street);
  return index >= 0 && index < STREET_ORDER.length - 1 ? STREET_ORDER[index + 1] : null;
};
