import type { Position } from './types';

export const PRESET_IDS = ['v1_tight', 'v2_standard'] as const;
export type PresetId = (typeof PRESET_IDS)[number];

export const PRESETS: Record<PresetId, { name: string; defaults: Record<Position, string> }> = {
  v1_tight: {
    name: 'Version 1 (Tight / rake-sensitive)',
    defaults: {
      UTG: '77+,ATs+,KJs+,QJs,AQo+',
      UTG1: '77+,ATs+,KJs+,QJs,AJo+,KQo',
      UTG2: '77+,ATs+,KTs+,QTs+,JTs,AJo+,KQo',
      LJ: '77+,A9s+,KTs+,QTs+,JTs,T9s,AJo+,KQo',
      HJ: '55+,A8s+,KTs+,QTs+,JTs,T9s,98s,AJo+,KQo',
      CO: '33+,A5s+,K9s+,Q9s+,J9s+,T9s,98s,ATo+,KJo+',
      BTN: '22+,A2s+,K7s+,Q8s+,J8s+,T8s+,97s+,87s,76s,A8o+,KTo+,QTo+,JTo',
      SB: '22+,A2s+,K7s+,Q8s+,J8s+,T8s+,98s,87s,76s,A8o+,KTo+,QTo+,JTo',
    },
  },
  v2_standard: {
    name: 'Version 2 (Standard / looser)',
    defaults: {
      UTG: '66+,ATs+,KJs+,QJs,AQo+,KQo',
      UTG1: '66+,ATs+,KJs+,QJs,AJo+,KQo',
      UTG2: '66+,A9s+,KTs+,QTs+,JTs,AJo+,KQo',
      LJ: '44+,A7s+,KTs+,QTs+,JTs,T9s,AJo+,KQo',
      HJ: '33+,A5s+,K9s+,Q9s+,J9s+,T9s,AJo+,KQo',
      CO: '22+,A2s+,K7s+,Q8s+,J8s+,T8s+,97s+,86s+,76s,65s,A8o+,KTo+,QTo+,JTo',
      BTN: '22+,A2s+,K2s+,Q5s+,J6s+,T6s+,95s+,85s+,75s+,64s+,54s,A2o+,K7o+,Q8o+,J8o+,T8o+,98o',
      SB: '22+,A2s+,K4s+,Q6s+,J7s+,T7s+,96s+,86s+,75s+,64s+,54s,A2o+,K8o+,Q8o+,J8o+,T8o+,98o',
    },
  },
};
