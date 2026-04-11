import type { BoardCandidateSource } from './advantageLibrary';

const CORE_FLOP_CANDIDATES = [
  ['As', '8d', '3c'], ['Ah', '7c', '2d'], ['Ac', '9h', '4d'], ['Ad', '6s', '2h'],
  ['Ks', '8d', '2c'], ['Kh', '9s', '3d'], ['Kc', '7h', '2d'], ['Kd', 'Jc', '4s'],
  ['Qs', 'Jh', '8d'], ['Qh', 'Jd', '9c'], ['Js', 'Td', '8c'],
  ['Qs', 'Jh', 'Td'], ['Kh', 'Qd', 'Jc'], ['Qh', 'Td', '9c'], ['Jh', 'Tc', '9d'],
  ['9s', '8d', '7c'], ['Ts', '9h', '8d'], ['8h', '7d', '6c'], ['Tc', '8d', '7h'],
  ['6s', '5d', '4c'], ['7h', '6d', '5s'], ['6h', '5c', '3d'], ['5h', '4d', '3c'],
  ['7s', '4d', '2c'], ['6h', '3d', '2s'], ['8c', '5d', '2h'], ['9d', '4h', '2c'],
  ['As', 'Ad', '7c'], ['Kh', 'Kd', '4s'], ['Qh', 'Qs', '8d'], ['Ts', 'Td', '6h'],
  ['5s', '5d', '2c'], ['4h', '4d', '7s'], ['3c', '3h', '8d'], ['2s', '2d', '9h'],
  ['As', 'Js', '4s'], ['Ks', 'Ts', '3s'], ['Qs', '9s', '2s'],
  ['8c', '6c', '3c'], ['7d', '5d', '2d'], ['6h', '4h', '2h'],
  ['Ah', 'Jh', '8d'], ['Kh', 'Th', '7c'], ['Qh', '9h', '7d'], ['Jh', '9h', '6c'],
  ['Ts', '8s', '6d'], ['7s', '6s', '2d'], ['Qd', 'Td', '7c'], ['Ad', 'Td', '4c'],
] as const;

const ALTERNATE_FLOP_CANDIDATES = [
  ...CORE_FLOP_CANDIDATES,
  ['Ac', 'Qc', '7d'],
  ['Kc', 'Jd', '8s'],
  ['9c', '7c', '5d'],
  ['Ah', 'Kd', 'Qc'],
  ['8s', '8h', '4d'],
  ['5c', '4c', '2s'],
] as const;

export const ADVANTAGE_BOARD_CANDIDATE_SOURCES: Record<string, BoardCandidateSource> = {
  coreFlopsV1: {
    id: 'coreFlopsV1',
    boards: CORE_FLOP_CANDIDATES,
  },
  coreFlopsPlusV1: {
    id: 'coreFlopsPlusV1',
    boards: ALTERNATE_FLOP_CANDIDATES,
  },
};
