import type { FacingOpenHeroPosition, Position } from './types';

export const PRESET_IDS = ['v1_tight', 'v2_standard'] as const;
export type PresetId = (typeof PRESET_IDS)[number];

export type FacingOpenMatchup = {
  heroPos: FacingOpenHeroPosition;
  villainPos: Position;
};

export type PresetDefinition = {
  name: string;
};

export const facingOpenKey = (heroPos: FacingOpenHeroPosition, villainPos: Position): string =>
  `FO_${heroPos}_VS_${villainPos}`;

export const PRESETS: Record<PresetId, PresetDefinition> = {
  v1_tight: {
    name: 'Version 1 (Tight / rake-sensitive)',
  },
  v2_standard: {
    name: 'Version 2 (Standard / looser)',
  },
};
