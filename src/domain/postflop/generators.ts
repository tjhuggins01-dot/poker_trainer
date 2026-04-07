import { createDeck } from './cards';
import { evaluateFlopHandCategory } from './evaluate';
import { buildHandCategoryExplanation } from './explanations';
import type { Card, FlopBoard, HandCategoryAnswer, HandCategoryPrompt, HoleCards, PromptDifficulty } from './types';

const difficultyAccepts = (difficulty: PromptDifficulty, category: HandCategoryAnswer, board: Card[]): boolean => {
  const isPairedBoard = new Set(board.map((c) => c.rank)).size < 3;
  const isMonotone = new Set(board.map((c) => c.suit)).size === 1;
  if (difficulty === 'easy') return !isPairedBoard && !isMonotone && ['high-card', 'one-pair', 'two-pair', 'set', 'straight', 'flush'].includes(category);
  if (difficulty === 'hard') return isPairedBoard || isMonotone || ['trips', 'full-house', 'quads'].includes(category);
  return true;
};

const hash = (value: string): number => [...value].reduce((acc, ch) => ((acc * 31) ^ ch.charCodeAt(0)) >>> 0, 2166136261);
const mulberry32 = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const generateHandCategoryPrompt = (difficulty: PromptDifficulty = 'medium', seed = `${Date.now()}`): HandCategoryPrompt => {
  const random = mulberry32(hash(`${difficulty}:${seed}`));
  const deck = createDeck();

  for (let tries = 0; tries < 400; tries += 1) {
    const shuffled = [...deck].sort(() => random() - 0.5);
    const heroHand: HoleCards = [shuffled[0], shuffled[1]];
    const board: FlopBoard = [shuffled[2], shuffled[3], shuffled[4]];
    const evaluation = evaluateFlopHandCategory(heroHand, board);
    if (!difficultyAccepts(difficulty, evaluation.category, board)) continue;

    const basePrompt = {
      id: `pf-${difficulty}-${hash(`${seed}-${tries}`)}`,
      heroHand,
      board,
      correctAnswer: evaluation.category,
      difficulty,
    };

    return {
      ...basePrompt,
      explanation: buildHandCategoryExplanation(basePrompt, evaluation),
    };
  }

  const fallbackHero: HoleCards = [deck[0], deck[1]];
  const fallbackBoard: FlopBoard = [deck[2], deck[3], deck[4]];
  const evaluation = evaluateFlopHandCategory(fallbackHero, fallbackBoard);
  const basePrompt = {
    id: `pf-fallback-${Date.now()}`,
    heroHand: fallbackHero,
    board: fallbackBoard,
    correctAnswer: evaluation.category,
    difficulty,
  };
  return { ...basePrompt, explanation: buildHandCategoryExplanation(basePrompt, evaluation) };
};
