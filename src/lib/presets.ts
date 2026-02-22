import type { Position } from './types';

export const PRESET_IDS = ['v1_tight', 'v2_standard'] as const;
export type PresetId = (typeof PRESET_IDS)[number];

export const PRESETS: Record<PresetId, { name: string; defaults: Record<Position, string> }> = {
  v1_tight: {
    name: 'Version 1 (Tight / rake-sensitive)',
    defaults: {
      UTG: '88+,AJs+,KQs,AKo',
      UTG1: '77+,ATs+,KJs+,QJs,AQo+',
      UTG2: '66+,ATs+,KTs+,QTs+,JTs,AQo+,KQo',
      LJ: '55+,A9s+,KTs+,QTs+,JTs,T9s,AJo+,KQo',
      HJ: '44+,A7s+,KTs+,QTs+,JTs,T9s,98s,AJo+,KQo',
      CO: '33+,A5s+,K9s+,Q9s+,J9s+,T9s,98s,87s,ATo+,KJo+,QJo',
      BTN: '22+,A2s+,K7s+,Q8s+,J8s+,T8s+,97s+,87s,76s,A8o+,KTo+,QTo+,JTo',
      SB: '22+,A2s+,K7s+,Q8s+,J8s+,T8s+,98s,87s,A8o+,KTo+,QTo+,JTo',
    },
  },
  v2_standard: {
    name: 'Version 2 (Standard / looser)',
    defaults: {
      UTG: '77+,AJs+,KQs,AQo+',
      UTG1: '66+,ATs+,KJs+,QJs,AQo+,KQo',
      UTG2: '55+,A9s+,KTs+,QTs+,JTs,ATo+,KQo',
      LJ: '44+,A7s+,KTs+,QTs+,JTs,T9s,AJo+,KQo',
      HJ: '33+,A5s+,K9s+,Q9s+,J9s+,T9s,98s,AJo+,KQo',
      CO: '22+,A2s+,K8s+,Q8s+,J8s+,T8s+,97s+,87s,A9o+,KTo+,QTo+',
      BTN: '22+,A2s+,K2s+,Q6s+,J7s+,T7s+,96s+,86s+,76s,65s,A2o+,K8o+,Q9o+,J9o+,T9o',
      SB: '22+,A2s+,K5s+,Q7s+,J8s+,T8s+,98s,87s,A2o+,K9o+,Q9o+,JTo',
    },
  },
};
