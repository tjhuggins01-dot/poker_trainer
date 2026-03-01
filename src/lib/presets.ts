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

// Editable baseline defaults for 9-max 100bb facing single RFI opens.
const VS_OPEN_DEFAULTS_V2: Record<string, { call: string; threeBet: string }> = {
  UTG1_vs_UTG: {
    threeBet: 'QQ,KK,AA,AKs,AKo',
    call: 'TT,JJ,AQs,AJs,KQs,QJs,JTs,T9s',
  },
  UTG2_vs_UTG: {
    threeBet: 'QQ,KK,AA,AKs,AKo,AQs',
    call: '99,TT,JJ,AJs,ATs,KQs,QJs,JTs,T9s,98s',
  },
  UTG2_vs_UTG1: {
    threeBet: 'QQ,KK,AA,AKs,AKo,AQs',
    call: '99,TT,JJ,AJs,ATs,KQs,QJs,JTs,T9s,98s,87s',
  },

  LJ_vs_UTG: {
    threeBet: 'QQ,KK,AA,AKs,AKo,AQs',
    call: '66,77,88,99,TT,JJ,AJs,KQs,QJs,JTs,T9s',
  },
  LJ_vs_UTG1: {
    threeBet: 'QQ,KK,AA,AKs,AKo,AQs',
    call: '55,66,77,88,99,TT,JJ,AJs,ATs,KQs,QJs,JTs,T9s,98s',
  },
  LJ_vs_UTG2: {
    threeBet: 'JJ,QQ,KK,AA,AKs,AKo,AQs,AQo',
    call: '44,55,66,77,88,99,TT,AJs,ATs,KQs,QJs,JTs,T9s,98s,87s',
  },

  HJ_vs_UTG: {
    threeBet: 'QQ,KK,AA,AKs,AKo,AQs',
    call: '66,77,88,99,TT,JJ,AJs,KQs,QJs,JTs,T9s',
  },
  HJ_vs_UTG1: {
    threeBet: 'JJ,QQ,KK,AA,AKs,AKo,AQs',
    call: '55,66,77,88,99,TT,AJs,ATs,KQs,QJs,JTs,T9s,98s',
  },
  HJ_vs_UTG2: {
    threeBet: 'JJ,QQ,KK,AA,AKs,AKo,AQs,AQo',
    call: '44,55,66,77,88,99,TT,AJs,ATs,KQs,QJs,JTs,T9s,98s,87s',
  },
  HJ_vs_LJ: {
    threeBet: 'JJ,QQ,KK,AA,AKs,AKo,AQs,AQo',
    call: '33,44,55,66,77,88,99,TT,AJs,ATs,KQs,KJs,QJs,JTs,T9s,98s,87s',
  },

  CO_vs_UTG: {
    threeBet: 'QQ,KK,AA,AKs,AKo,AQs',
    call: '66,77,88,99,TT,JJ,AJs,KQs,QJs,JTs,T9s',
  },
  CO_vs_UTG1: {
    threeBet: 'QQ,KK,AA,AKs,AKo,AQs',
    call: '55,66,77,88,99,TT,JJ,AJs,ATs,KQs,QJs,JTs,T9s,98s',
  },
  CO_vs_UTG2: {
    threeBet: 'JJ,QQ,KK,AA,AKs,AKo,AQs,AQo',
    call: '44,55,66,77,88,99,TT,AJs,ATs,KQs,QJs,JTs,T9s,98s,87s',
  },
  CO_vs_LJ: {
    threeBet: 'JJ,QQ,KK,AA,AKs,AKo,AQs,AQo',
    call: '33,44,55,66,77,88,99,TT,AJs,ATs,KQs,QJs,JTs,T9s,98s,87s',
  },
  CO_vs_HJ: {
    threeBet: 'TT,JJ,QQ,KK,AA,AKs,AKo,AQs,AQo,A5s',
    call: '22,33,44,55,66,77,88,99,AJs,ATs,KQs,KJs,QTs,QJs,JTs,T9s,98s,87s,76s',
  },

  BTN_vs_UTG: {
    threeBet: 'QQ,KK,AA,AKs,AKo,AQs',
    call: '55,66,77,88,99,TT,JJ,AJs,KQs,QJs,JTs,T9s,98s,87s',
  },
  BTN_vs_UTG1: {
    threeBet: 'JJ,QQ,KK,AA,AKs,AKo,AQs,AQo',
    call: '44,55,66,77,88,99,TT,AJs,ATs,KQs,KJs,QJs,JTs,T9s,98s,87s,76s',
  },
  BTN_vs_UTG2: {
    threeBet: 'TT,JJ,QQ,KK,AA,AKs,AKo,AQs,AQo,A5s',
    call: '33,44,55,66,77,88,99,AJs,ATs,AJo,KQs,KJs,QJs,JTs,T9s,98s,87s,76s,65s',
  },
  BTN_vs_LJ: {
    threeBet: 'TT,JJ,QQ,KK,AA,AKs,AKo,AQs,AQo,A5s,KQs',
    call: '22,33,44,55,66,77,88,99,A9s,ATs,AJs,AJo,KJs,QJs,JTs,T9s,98s,87s,76s,65s',
  },
  BTN_vs_HJ: {
    // AQs MUST continue (call or 3bet) — never fold.
    threeBet: '99,TT,JJ,QQ,KK,AA,AKs,AKo,AQs,AQo,A5s,KQs,KJs',
    call: '22,33,44,55,66,77,88,A9s,ATs,AJs,AJo,KTs,QTs,QJs,JTs,T9s,98s,87s,76s,65s,54s',
  },
  BTN_vs_CO: {
    // AQs MUST continue (call or 3bet) — never fold.
    threeBet: '99,TT,JJ,QQ,KK,AA,AKs,AKo,AQs,AQo,A5s,A4s,KQs,KJs,QJs,JTs',
    call: '22,33,44,55,66,77,88,A2s,A3s,A6s,A7s,A8s,A9s,ATs,AJs,AJo,KTs,KQo,QTs,QJo,T9s,98s,87s,76s,65s,54s,T9o',
  },

  SB_vs_UTG: {
    threeBet: 'QQ,KK,AA,AKs,AKo,AQs',
    call: '66,77,88,99,TT,JJ,AJs,KQs,QJs,JTs,T9s,98s',
  },
  SB_vs_UTG1: {
    threeBet: 'JJ,QQ,KK,AA,AKs,AKo,AQs,AQo',
    call: '55,66,77,88,99,TT,AJs,ATs,KQs,QJs,JTs,T9s,98s,87s',
  },
  SB_vs_UTG2: {
    threeBet: 'TT,JJ,QQ,KK,AA,AKs,AKo,AQs,AQo,A5s',
    call: '44,55,66,77,88,99,AJs,ATs,AJo,KQs,QJs,JTs,T9s,98s,87s,76s',
  },
  SB_vs_LJ: {
    threeBet: 'TT,JJ,QQ,KK,AA,AKs,AKo,AQs,AQo,A5s,KQs',
    call: '33,44,55,66,77,88,99,A9s,ATs,AJs,AJo,KJs,QJs,JTs,T9s,98s,87s,76s,65s',
  },
  SB_vs_HJ: {
    threeBet: '99,TT,JJ,QQ,KK,AA,AKs,AKo,AQs,AQo,A5s,KQs,KJs,QJs',
    call: '22,33,44,55,66,77,88,A9s,ATs,AJs,AJo,KTs,QTs,JTs,T9s,98s,87s,76s,65s,54s',
  },
  SB_vs_CO: {
    threeBet: '99,TT,JJ,QQ,KK,AA,AKs,AKo,AQs,AQo,A5s,A4s,KQs,KJs,QJs,JTs,T9s',
    call: '22,33,44,55,66,77,88,A2s,A3s,A6s,A7s,A8s,A9s,ATs,AJs,AJo,KTs,KQo,QTs,QJo,JTo,98s,87s,76s,65s,54s,T9o',
  },
  SB_vs_BTN: {
    threeBet: '88,99,TT,JJ,QQ,KK,AA,AKs,AKo,AQs,AQo,A5s,A4s,KQs,KJs,QJs,JTs,T9s,98s',
    call: '22,33,44,55,66,77,A2s,A3s,A6s,A7s,A8s,A9s,ATs,AJs,AJo,K9s,KTs,QTs,QJo,JTo,T8s,87s,76s,65s,54s,T9o',
  },

  BB_vs_UTG: {
    threeBet: 'QQ,KK,AA,AKs,AKo,AQs',
    call: '55,66,77,88,99,TT,JJ,ATs,AJs,KQs,QJs,JTs,T9s,98s,87s,76s',
  },
  BB_vs_UTG1: {
    threeBet: 'JJ,QQ,KK,AA,AKs,AKo,AQs,AQo',
    call: '44,55,66,77,88,99,TT,ATs,AJs,KQs,KJs,QJs,JTs,T9s,98s,87s,76s,65s',
  },
  BB_vs_UTG2: {
    threeBet: 'TT,JJ,QQ,KK,AA,AKs,AKo,AQs,AQo,A5s',
    call: '33,44,55,66,77,88,99,ATs,AJs,AJo,KQs,KJs,QJs,JTs,T9s,98s,87s,76s,65s,54s',
  },
  BB_vs_LJ: {
    threeBet: 'TT,JJ,QQ,KK,AA,AKs,AKo,AQs,AQo,A5s,KQs',
    call: '22,33,44,55,66,77,88,99,A9s,ATs,AJs,AJo,KJs,QJs,JTs,T9s,98s,87s,76s,65s,54s',
  },
  BB_vs_HJ: {
    threeBet: '99,TT,JJ,QQ,KK,AA,AKs,AKo,AQs,AQo,A5s,A4s,KQs,KJs',
    call: '22,33,44,55,66,77,88,A9s,ATs,AJs,AJo,KTs,QTs,QJs,JTs,T9s,98s,87s,76s,65s,54s,T9o',
  },
  BB_vs_CO: {
    threeBet: '99,TT,JJ,QQ,KK,AA,AKs,AKo,AQs,AQo,A5s,A4s,KQs,KJs,QJs,JTs',
    call: '22,33,44,55,66,77,88,A2s,A3s,A6s,A7s,A8s,A9s,ATs,AJs,AJo,K9s,KTs,KQo,QTs,QJo,JTo,T8s,T9s,97s,98s,87s,76s,65s,54s,T9o',
  },
  BB_vs_BTN: {
    threeBet: '88,99,TT,JJ,QQ,KK,AA,AKs,AKo,AQs,AQo,A5s,A4s,A3s,KQs,KJs,QJs,JTs,T9s,98s,87s',
    call: '22,33,44,55,66,77,A2s,A6s,A7s,A8s,A9s,ATs,AJs,AJo,ATo,K7s,K8s,K9s,KTs,KQo,Q8s,Q9s,QTs,QJo,J8s,J9s,JTo,T8s,T9o,97s,86s,76s,65s,54s,43s',
  },
  BB_vs_SB: {
    threeBet: '99,TT,JJ,QQ,KK,AA,AKs,AKo,AQs,AQo,A5s,A4s,KQs,KJs,QJs',
    call: '22,33,44,55,66,77,88,A2s,A3s,A6s,A7s,A8s,A9s,ATs,AJs,AJo,K9s,KTs,KQo,Q9s,QTs,QJo,J9s,JTs,JTo,T8s,T9s,T9o,98s,87s,76s,65s,54s',
  },
};

const toFacingOpenPreset = (defaults: Record<string, { call: string; threeBet: string }>) =>
  Object.fromEntries(
    Object.entries(defaults).map(([k, v]) => {
      const [heroPos, villainPos] = k.split('_vs_');
      return [facingOpenKey(heroPos as FacingOpenHeroPosition, villainPos as Position), v];
    }),
  );

export const PRESETS: Record<PresetId, PresetDefinition> = {
  v1_tight: {
    name: 'Version 1 (Tight / rake-sensitive)',
    rfi: {
      raise: {
        UTG: '88+,AJs+,KQs,AQo+',
        UTG1: '77+,AJs+,KQs,AQo+,KQo',
        UTG2: '66+,ATs+,KQs,QJs,JTs,AQo+,KQo',
        LJ: '66+,ATs+,KJs+,QJs,JTs,T9s,AJo+,KQo',
        HJ: '55+,A9s+,KTs+,QTs+,JTs,T9s,98s,AJo+,KQo',
        CO: '33+,A5s+,K9s+,Q9s+,J9s+,T9s,98s,ATo+,KJo+',
        BTN: '22+,A2s+,K7s+,Q8s+,J8s+,T8s+,97s+,87s,76s,A8o+,KTo+,QTo+,JTo',
        SB: '55+,A8s+,KTs+,QTs+,JTs,T9s,98s,A9o+,KJo+',
      },
      limp: {
        // Disjoint from SB raise. No pair intervals. Added 76s,87s to remove weird gaps.
        SB: '22,33,44,A2s,A3s,A4s,A5s,A6s,A7s,K6s,K7s,K8s,K9s,Q7s,Q8s,Q9s,J7s,J8s,J9s,T7s,T8s,97s,87s,86s,76s,75s,65s,A2o,A3o,A4o,A5o,A6o,A7o,A8o,K9o,KTo,Q9o,QTo,J9o,JTo',
      },
    },
    facingOpen: toFacingOpenPreset(VS_OPEN_DEFAULTS_V2),
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
        BTN: '22+,A2s+,K2s+,Q5s+,J6s+,T6s+,95s+,85s+,75s+,64s+,54s,A2o+,K7o+,Q8o+,J8o+,T8o+',
        // Added T9s,76s,65s to remove weird gaps/inconsistencies.
        SB: '44+,A5s+,K8s+,Q9s+,J9s+,T8s+,T9s,98s,87s,76s,65s,A8o+,KTo+,QTo+,JTo',
      },
      limp: {
        // Disjoint from SB raise. No pair intervals. Wider than v1.
        SB: '22,33,A2s,A3s,A4s,K4s,K5s,K6s,K7s,Q6s,Q7s,Q8s,J7s,J8s,T7s,T8s,97s,86s,75s,64s,54s,A2o,A3o,A4o,A5o,A6o,A7o,K8o,K9o,Q8o,Q9o,J8o,J9o,T8o,T9o',
      },
    },
    facingOpen: toFacingOpenPreset(VS_OPEN_DEFAULTS_V2),
  },
};
