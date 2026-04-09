import { createDeck } from './cards';
import { evaluateHandCategory } from './evaluate';
import { buildHandCategoryExplanation } from './explanations';
import type { Card, FlopBoard, HandCategoryAnswer, HandCategorySequencePrompt, HoleCards, PromptDifficulty } from './types';

const difficultyAccepts = (difficulty: PromptDifficulty, category: HandCategoryAnswer, flop: FlopBoard): boolean => {
  const isPairedBoard = new Set(flop.map((c) => c.rank)).size < 3;
  const isMonotone = new Set(flop.map((c) => c.suit)).size === 1;
  if (difficulty === 'easy') return !isPairedBoard && !isMonotone && ['high-card', 'one-pair', 'two-pair', 'trips', 'straight', 'flush'].includes(category);
  if (difficulty === 'hard') return isPairedBoard || isMonotone || ['trips', 'full-house', 'quads', 'straight-flush'].includes(category);
  return true;
};

const hash = (value: string): number => [...value].reduce((acc, ch) => ((acc * 31) ^ ch.charCodeAt(0)) >>> 0, 2166136261);
const mulberry32 = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const buildSequencePrompt = (
  id: string,
  heroHand: HoleCards,
  flop: FlopBoard,
  turn: Card,
  river: Card,
  difficulty: PromptDifficulty,
): HandCategorySequencePrompt => {
  const turnBoard = [...flop, turn];
  const riverBoard = [...turnBoard, river];

  const flopEval = evaluateHandCategory(heroHand, flop);
  const turnEval = evaluateHandCategory(heroHand, turnBoard);
  const riverEval = evaluateHandCategory(heroHand, riverBoard);

  return {
    id,
    heroHand,
    runout: { flop, turn, river },
    difficulty,
    streets: {
      flop: {
        street: 'flop',
        board: flop,
        correctAnswer: flopEval.category,
        explanation: buildHandCategoryExplanation({ heroHand, board: flop }, flopEval),
      },
      turn: {
        street: 'turn',
        board: turnBoard,
        correctAnswer: turnEval.category,
        explanation: buildHandCategoryExplanation({ heroHand, board: turnBoard }, turnEval),
      },
      river: {
        street: 'river',
        board: riverBoard,
        correctAnswer: riverEval.category,
        explanation: buildHandCategoryExplanation({ heroHand, board: riverBoard }, riverEval),
      },
    },
  };
};

export const generateHandCategorySequencePrompt = (difficulty: PromptDifficulty = 'medium', seed = `${Date.now()}`): HandCategorySequencePrompt => {
  const random = mulberry32(hash(`${difficulty}:${seed}`));
  const deck = createDeck();

  for (let tries = 0; tries < 400; tries += 1) {
    const shuffled = [...deck].sort(() => random() - 0.5);
    const heroHand: HoleCards = [shuffled[0], shuffled[1]];
    const flop: FlopBoard = [shuffled[2], shuffled[3], shuffled[4]];
    const turn = shuffled[5];
    const river = shuffled[6];

    const flopEval = evaluateHandCategory(heroHand, flop);
    if (!difficultyAccepts(difficulty, flopEval.category, flop)) continue;

    return buildSequencePrompt(`pf-${difficulty}-${hash(`${seed}-${tries}`)}`, heroHand, flop, turn, river, difficulty);
  }

  const fallbackHero: HoleCards = [deck[0], deck[1]];
  const fallbackFlop: FlopBoard = [deck[2], deck[3], deck[4]];
  return buildSequencePrompt(`pf-fallback-${Date.now()}`, fallbackHero, fallbackFlop, deck[5], deck[6], difficulty);
};

export const generateHandCategoryPrompt = generateHandCategorySequencePrompt;
