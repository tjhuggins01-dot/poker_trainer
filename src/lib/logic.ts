import { POSITIONS, type Action, type AppData, type HandClass, type Position, type Situation } from './types';
import { generateAllHandClasses169 } from './hands';

export const randomPick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

export const computeCorrectAction = (appData: AppData, situation: Situation, handClass: HandClass): Action => {
  const key = `OPEN_9MAX_100BB_${situation.position}`;
  const openSet = new Set(appData.situations[key]?.policy.openHands ?? []);
  return openSet.has(handClass) ? 'OPEN' : 'FOLD';
};

export const nextPrompt = (): { position: Position; handClass: HandClass } => ({
  position: randomPick([...POSITIONS]),
  handClass: randomPick(generateAllHandClasses169()),
});
