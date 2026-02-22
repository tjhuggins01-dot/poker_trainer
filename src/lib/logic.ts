import { generateAllHandClasses169, handClassToGridCoord } from './hands';
import {
  POSITIONS,
  type Action,
  type AppData,
  type DifficultyMode,
  type HandClass,
  type Position,
  type Situation,
} from './types';

const allHands = generateAllHandClasses169();

export const randomPick = <T>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

export const computeCorrectAction = (
  appData: AppData,
  situation: Situation,
  handClass: HandClass,
): Action => {
  const key = `OPEN_9MAX_100BB_${situation.position}`;
  const openSet = new Set(appData.situations[key]?.policy.openHands ?? []);
  return openSet.has(handClass) ? 'OPEN' : 'FOLD';
};

type WeightedHand = { hand: HandClass; weight: number };

const distanceBetweenHands = (a: HandClass, b: HandClass): number => {
  const aCoord = handClassToGridCoord(a);
  const bCoord = handClassToGridCoord(b);
  return Math.abs(aCoord.row - bCoord.row) + Math.abs(aCoord.col - bCoord.col);
};

const computeBoundaryDistances = (openHands: HandClass[]): Record<HandClass, number> => {
  const openSet = new Set(openHands);
  const closedHands = allHands.filter((hand) => !openSet.has(hand));
  const distances: Record<HandClass, number> = {} as Record<HandClass, number>;

  allHands.forEach((hand) => {
    const opponentSet = openSet.has(hand) ? closedHands : openHands;
    if (opponentSet.length === 0) {
      distances[hand] = allHands.length;
      return;
    }

    let minDistance = Number.POSITIVE_INFINITY;
    opponentSet.forEach((otherHand) => {
      const distance = distanceBetweenHands(hand, otherHand);
      if (distance < minDistance) minDistance = distance;
    });
    distances[hand] = minDistance;
  });

  return distances;
};

const difficultyWeight = (distance: number, mode: DifficultyMode): number => {
  if (mode === 'uniform') return 1;
  if (mode === 'hard') return 1 / (distance + 0.25) ** 2;
  return 1 / (distance + 1);
};

export const buildWeightedHandMap = (data: AppData): Record<Position, WeightedHand[]> => {
  const byPosition = {} as Record<Position, WeightedHand[]>;

  POSITIONS.forEach((position) => {
    const key = `OPEN_9MAX_100BB_${position}`;
    const openHands = data.situations[key]?.policy.openHands ?? [];
    const boundaryDistances = computeBoundaryDistances(openHands);
    byPosition[position] = allHands.map((hand) => ({
      hand,
      weight: Math.max(difficultyWeight(boundaryDistances[hand], data.settings.difficulty), 0.0001),
    }));
  });

  return byPosition;
};

const weightedPick = (weights: WeightedHand[]): HandClass => {
  const total = weights.reduce((sum, item) => sum + item.weight, 0);
  const roll = Math.random() * total;
  let running = 0;
  for (const item of weights) {
    running += item.weight;
    if (running >= roll) return item.hand;
  }
  return weights[weights.length - 1].hand;
};

export const nextPrompt = (
  weightedMap?: Record<Position, WeightedHand[]>,
): { position: Position; handClass: HandClass } => {
  const position = randomPick([...POSITIONS]);
  const weightedHands = weightedMap?.[position];
  return {
    position,
    handClass: weightedHands ? weightedPick(weightedHands) : randomPick(allHands),
  };
};
