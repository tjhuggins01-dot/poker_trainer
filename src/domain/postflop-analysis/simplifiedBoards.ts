import { parseCard } from '../postflop/cards';
import type { FlopBoard } from '../postflop/types';

export type SuitTexture = 'rainbow' | 'two-tone' | 'monotone';
export type RankFamily = 'ace-high' | 'king-high' | 'broadway' | 'middling' | 'low' | 'high-card';
export type BoardStructure = 'connected' | 'disconnected' | 'paired';

export type SimplifiedBoardPreset = {
  id: string;
  label: string;
  suitTexture: SuitTexture;
  rankFamily: RankFamily;
  structure: BoardStructure;
  cards: [string, string, string];
};

export const SIMPLIFIED_BOARD_PRESETS: SimplifiedBoardPreset[] = [
  { id: 'a_high_rainbow_disconnected', label: 'A-high rainbow disconnected', suitTexture: 'rainbow', rankFamily: 'ace-high', structure: 'disconnected', cards: ['As', '8d', '3c'] },
  { id: 'k_high_twotone_disconnected', label: 'K-high two-tone disconnected', suitTexture: 'two-tone', rankFamily: 'king-high', structure: 'disconnected', cards: ['Kh', '9h', '2c'] },
  { id: 'broadway_connected_twotone', label: 'Broadway connected two-tone', suitTexture: 'two-tone', rankFamily: 'broadway', structure: 'connected', cards: ['Qh', 'Jh', 'Td'] },
  { id: 'low_connected_rainbow', label: 'Low connected rainbow', suitTexture: 'rainbow', rankFamily: 'low', structure: 'connected', cards: ['6s', '5d', '4c'] },
  { id: 'low_connected_twotone', label: 'Low connected two-tone', suitTexture: 'two-tone', rankFamily: 'low', structure: 'connected', cards: ['6h', '5h', '4c'] },
  { id: 'middling_connected_twotone', label: 'Middling connected two-tone', suitTexture: 'two-tone', rankFamily: 'middling', structure: 'connected', cards: ['9s', '8s', '7d'] },
  { id: 'paired_high_rainbow', label: 'Paired high rainbow', suitTexture: 'rainbow', rankFamily: 'ace-high', structure: 'paired', cards: ['As', 'Ah', '7d'] },
  { id: 'paired_low_rainbow', label: 'Paired low rainbow', suitTexture: 'rainbow', rankFamily: 'low', structure: 'paired', cards: ['5s', '5h', '2d'] },
  { id: 'monotone_broadway', label: 'Monotone broadway', suitTexture: 'monotone', rankFamily: 'ace-high', structure: 'connected', cards: ['As', 'Ks', 'Qs'] },
  { id: 'monotone_low', label: 'Monotone low', suitTexture: 'monotone', rankFamily: 'low', structure: 'disconnected', cards: ['6c', '4c', '2c'] },
  { id: 'high_disconnected_rainbow', label: 'High-card disconnected rainbow', suitTexture: 'rainbow', rankFamily: 'high-card', structure: 'disconnected', cards: ['Qs', '8d', '3c'] },
  { id: 'high_disconnected_twotone', label: 'High-card disconnected two-tone', suitTexture: 'two-tone', rankFamily: 'high-card', structure: 'disconnected', cards: ['Jh', '7h', '2c'] },
];

const RANK_VALUES: Record<string, number> = {
  A: 14, K: 13, Q: 12, J: 11, T: 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
};

const getSuitTexture = (flop: FlopBoard): SuitTexture => {
  const distinct = new Set(flop.map((card) => card.suit)).size;
  if (distinct === 3) return 'rainbow';
  if (distinct === 2) return 'two-tone';
  return 'monotone';
};

const rankValues = (flop: FlopBoard): number[] => flop.map((card) => RANK_VALUES[card.rank]).sort((a, b) => b - a);

const isConnected = (values: number[]): boolean => {
  const unique = [...new Set(values)].sort((a, b) => a - b);
  return unique.length === 3 && unique[2] - unique[0] <= 2;
};

const getStructure = (flop: FlopBoard): BoardStructure => {
  const uniqueRanks = new Set(flop.map((card) => card.rank));
  if (uniqueRanks.size < 3) return 'paired';
  return isConnected(rankValues(flop)) ? 'connected' : 'disconnected';
};

const getRankFamily = (flop: FlopBoard): RankFamily => {
  const values = rankValues(flop);
  const [top, middle] = values;
  if (top === 14) return 'ace-high';
  if (top === 13) return 'king-high';
  if (top >= 12 && middle >= 10) return 'broadway';
  if (top <= 9 && top >= 7) return 'middling';
  if (top <= 8) return 'low';
  return 'high-card';
};

export const generateFlopFromPreset = (presetId: string): FlopBoard => {
  const preset = SIMPLIFIED_BOARD_PRESETS.find((entry) => entry.id === presetId);
  if (!preset) throw new Error(`Unknown simplified board preset: ${presetId}`);
  return preset.cards.map((card) => parseCard(card)) as FlopBoard;
};

export const flopMatchesPreset = (flop: FlopBoard, preset: SimplifiedBoardPreset): boolean => {
  const suitTexture = getSuitTexture(flop);
  const structure = getStructure(flop);
  const rankFamily = getRankFamily(flop);
  const uniqueCards = new Set(flop.map((card) => `${card.rank}${card.suit}`)).size === flop.length;
  return uniqueCards && suitTexture === preset.suitTexture && structure === preset.structure && rankFamily === preset.rankFamily;
};
