import type { FacingOpenHeroPosition, Position, RfiPosition } from './types';

export const PRESET_IDS = ['v1_tight', 'v2_standard'] as const;
export type PresetId = (typeof PRESET_IDS)[number];

export type FacingOpenMatchup = {
  heroPos: FacingOpenHeroPosition;
  villainPos: Position;
};

export type PresetDefinition = {
  name: string;
  rfi: {
    raise: Record<RfiPosition, string>;
    limp: { SB: string };
  };
  facingOpen: Record<string, { call: string; threeBet: string }>;
};

export const facingOpenKey = (heroPos: FacingOpenHeroPosition, villainPos: Position): string =>
  `FO_${heroPos}_VS_${villainPos}`;

export const PRESETS: Record<PresetId, PresetDefinition> = {
  v1_tight: {
    name: 'Version 1 (Tight / rake-sensitive)',
    rfi: {
      raise: {
        UTG: '77+,ATs+,KJs+,QJs,AQo+',
        UTG1: '77+,ATs+,KJs+,QJs,AJo+,KQo',
        UTG2: '77+,ATs+,KTs+,QTs+,JTs,AJo+,KQo',
        LJ: '77+,A9s+,KTs+,QTs+,JTs,T9s,AJo+,KQo',
        HJ: '55+,A8s+,KTs+,QTs+,JTs,T9s,98s,AJo+,KQo',
        CO: '33+,A5s+,K9s+,Q9s+,J9s+,T9s,98s,ATo+,KJo+',
        BTN: '22+,A2s+,K7s+,Q8s+,J8s+,T8s+,97s+,87s,76s,A8o+,KTo+,QTo+,JTo',
        SB: '55+,A8s+,KTs+,QTs+,JTs,T9s,98s,A9o+,KJo+',
      },
      limp: {
        SB: '22-44,A2s-A7s,K6s-K9s,Q7s-Q9s,J7s-J9s,T7s-T9s,97s-86s,75s-65s,A2o-A8o,K9o-KTo,Q9o-QTo,J9o-JTo',
      },
    },
    facingOpen: {
      [facingOpenKey('BTN', 'CO')]: {
        threeBet: 'QQ+,AKs,AKo,A5s-A4s,KQs',
        call: '22-JJ,A2s-AQs,KTs-KQs,QTs-QJs,JTs,T9s,98s,87s,AJo-AQo,KQo',
      },
      [facingOpenKey('BTN', 'HJ')]: {
        threeBet: 'QQ+,AKs,AKo,A5s-A4s',
        call: '55-JJ,A7s-AQs,KTs-KQs,QTs-QJs,JTs,T9s,98s,AQo',
      },
      [facingOpenKey('CO', 'HJ')]: {
        threeBet: 'QQ+,AKs,AKo,A5s',
        call: '66-JJ,A9s-AQs,KTs-KQs,QTs-QJs,JTs,T9s,98s,AQo',
      },
      [facingOpenKey('SB', 'BTN')]: {
        threeBet: 'TT+,AQs+,AKo,A5s-A2s,KQs,KJs,QJs',
        call: '22-99,A2s-AJs,K9s-KTs,Q9s-QTs,J9s-JTs,T8s+,97s+,87s,AJo,KQo,QJo',
      },
      [facingOpenKey('BB', 'BTN')]: {
        threeBet: 'JJ+,AQs+,AKo,A5s-A2s,KQs,KJs,QJs',
        call: '22-TT,A2s-AJs,K5s-KTs,Q7s-QTs,J8s-JTs,T8s+,97s+,86s+,75s+,64s+,53s+,A8o-AJo,KTo+,QTo+,JTo,T9o',
      },
    },
  },
  v2_standard: {
    name: 'Version 2 (Standard / looser)',
    rfi: {
      raise: {
        UTG: '66+,ATs+,KJs+,QJs,AQo+,KQo',
        UTG1: '66+,ATs+,KJs+,QJs,AJo+,KQo',
        UTG2: '66+,A9s+,KTs+,QTs+,JTs,AJo+,KQo',
        LJ: '44+,A7s+,KTs+,QTs+,JTs,T9s,AJo+,KQo',
        HJ: '33+,A5s+,K9s+,Q9s+,J9s+,T9s,AJo+,KQo',
        CO: '22+,A2s+,K7s+,Q8s+,J8s+,T8s+,97s+,86s+,76s,65s,A8o+,KTo+,QTo+,JTo',
        BTN: '22+,A2s+,K2s+,Q5s+,J6s+,T6s+,95s+,85s+,75s+,64s+,54s,A2o+,K7o+,Q8o+,J8o+,T8o+,98o',
        SB: '44+,A5s+,K8s+,Q9s+,J9s+,T8s+,98s,87s,A8o+,KTo+,QTo+,JTo',
      },
      limp: {
        SB: '22-33,A2s-A4s,K4s-K7s,Q6s-Q8s,J7s-J8s,T7s-T9s,97s-86s,75s-54s,A2o-A7o,K8o-K9o,Q8o-Q9o,J8o-J9o,T8o-T9o,98o',
      },
    },
    facingOpen: {
      [facingOpenKey('BTN', 'CO')]: {
        threeBet: 'JJ+,AKs,AKo,AQo,A5s-A2s,KQs',
        call: '22-TT,A2s-AJs,K9s-KJs,Q9s-QJs,J9s-JTs,T8s+,97s+,86s+,AJo,KQo,QJo',
      },
      [facingOpenKey('BTN', 'HJ')]: {
        threeBet: 'QQ+,AKs,AKo,AQo,A5s-A3s,KQs',
        call: '44-JJ,A5s-AJs,KTs-KQs,QTs-QJs,JTs,T9s,98s,87s,AJo-AQo,KQo',
      },
      [facingOpenKey('CO', 'HJ')]: {
        threeBet: 'QQ+,AKs,AKo,AQs,A5s-A4s',
        call: '55-JJ,A7s-AJs,KTs-KQs,QTs-QJs,JTs,T9s,98s,AQo,KQo',
      },
      [facingOpenKey('SB', 'BTN')]: {
        threeBet: '99+,AQs+,AKo,A5s-A2s,KQs-KTs,QJs-QTs,JTs,T9s',
        call: '22-88,A2s-AJs,K7s-KJs,Q8s-QJs,J8s-JTs,T7s-T9s,97s+,86s+,A8o-AJo,KTo+,QTo+,JTo',
      },
      [facingOpenKey('BB', 'BTN')]: {
        threeBet: 'TT+,AQs+,AKo,A5s-A2s,KQs-KTs,QJs-QTs,JTs',
        call: '22-99,A2s-AJs,K2s-KJs,Q5s-QJs,J7s-JTs,T7s-T9s,96s+,85s+,75s+,64s+,54s,A2o-AJo,K8o+,Q9o+,J9o+,T9o,98o',
      },
    },
  },
};
