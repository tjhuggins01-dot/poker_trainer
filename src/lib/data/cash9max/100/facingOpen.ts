import { facingOpenKey } from '../../../presets';
import type { FacingOpenHeroPosition, Position } from '../../../types';

const RAW_FACING_OPEN_DEFAULTS_100BB = {
  UTG1_vs_UTG: {
    threeBet: 'QQ+,AKs,AKo',
    call: 'JJ,TT,AQs,AJs,KQs,QJs',
  },
  UTG2_vs_UTG: {
    threeBet: 'QQ+,AQs+,AKo',
    call: 'JJ-99,AJs,ATs,KQs,QJs,JTs',
  },
  UTG2_vs_UTG1: {
    threeBet: 'QQ+,AQs+,AKo',
    call: 'JJ-99,AJs,ATs,KQs,QJs,JTs',
  },

  LJ_vs_UTG: {
    threeBet: 'QQ+,AQs+,AKo',
    call: 'JJ-66,AJs,KQs,QJs,JTs,T9s',
  },
  LJ_vs_UTG1: {
    threeBet: 'QQ+,AQs+,AKo',
    call: 'JJ-55,AJs,ATs,KQs,QJs,JTs,T9s',
  },
  LJ_vs_UTG2: {
    threeBet: 'JJ+,AQs+,AQo+',
    call: 'TT-44,AJs,ATs,KQs,QJs,JTs,T9s',
  },

  HJ_vs_UTG: {
    threeBet: 'QQ+,AQs+,AKo',
    call: 'JJ-66,AJs,KQs,QJs,JTs,T9s',
  },
  HJ_vs_UTG1: {
    threeBet: 'JJ+,AQs+,AKo',
    call: 'TT-55,AJs,ATs,KQs,QJs,JTs,T9s',
  },
  HJ_vs_UTG2: {
    threeBet: 'JJ+,AQs+,AQo+',
    call: 'TT-44,AJs,ATs,KQs,QJs,JTs,T9s',
  },
  HJ_vs_LJ: {
    threeBet: 'JJ+,AQs+,AQo+',
    call: 'TT-33,AJs,ATs,KQs,KJs,QJs,JTs,T9s',
  },

  CO_vs_UTG: {
    threeBet: 'QQ+,AQs+,AKo',
    call: 'JJ-66,AJs,KQs,QJs,JTs,T9s',
  },
  CO_vs_UTG1: {
    threeBet: 'QQ+,AQs+,AKo',
    call: 'JJ-55,AJs,ATs,KQs,QJs,JTs,T9s,98s',
  },
  CO_vs_UTG2: {
    threeBet: 'JJ+,AQs+,AQo+',
    call: 'TT-44,AJs,ATs,KQs,QJs,JTs,T9s,98s,87s',
  },
  CO_vs_LJ: {
    threeBet: 'JJ+,AQs+,AQo+',
    call: 'TT-33,AJs,ATs,KQs,QJs,JTs,T9s,98s,87s',
  },
  CO_vs_HJ: {
    threeBet: 'TT+,AQs+,A5s,AQo+',
    call: '99-22,AJs,ATs,KQs,KJs,QTs,QJs,JTs,T9s,98s,87s,76s',
  },

  BTN_vs_UTG: {
    threeBet: 'QQ+,AQs+,AQo+',
    call: 'JJ-55,AJs,KQs,QJs,JTs,T9s,98s,87s',
  },
  BTN_vs_UTG1: {
    threeBet: 'JJ+,AQs+,AQo+',
    call: 'TT-44,AJs,ATs,KQs,KJs,QJs,JTs,T9s,98s,87s,76s',
  },
  BTN_vs_UTG2: {
    threeBet: 'TT+,AQs+,A5s,AQo+',
    call: '99-33,AJs,ATs,KQs,KJs,QJs,JTs,T9s,98s,87s,76s,65s,AJo',
  },
  BTN_vs_LJ: {
    threeBet: 'TT+,AQs+,A5s,KQs,AQo+',
    call: '99-22,AJs,ATs,A9s,KJs,QJs,JTs,T9s,98s,87s,76s,65s,AJo',
  },
  BTN_vs_HJ: {
    threeBet: '99+,AJs+,A5s,KJs+,AQo+',
    call: '88-22,ATs,A9s,KTs,QTs,QJs,T9s,98s,87s,76s,65s,54s,AJo,KQo,QJo,JTs',
  },
  BTN_vs_CO: {
    threeBet: '99+,AQs+,A5s,A4s,KJs+,QJs,JTs,AQo+',
    call: '88-22,AJs,ATs,A9s,A8s,A7s,A6s,A3s,A2s,KTs,K9s,QTs,T9s,98s,87s,76s,65s,54s,AJo,KQo,QJo,JTo,T9o',
  },

  SB_vs_UTG: {
    threeBet: 'JJ+,AQs+,AKo',
    call: 'TT-66,AJs,KQs,QJs,JTs,T9s,98s,AQo',
  },
  SB_vs_UTG1: {
    threeBet: 'JJ+,AQs+,AQo+',
    call: 'TT-55,AJs,ATs,KQs,QJs,JTs,T9s,98s,87s',
  },
  SB_vs_UTG2: {
    threeBet: 'TT+,AQs+,A5s,AQo+',
    call: '99-44,AJs,ATs,KQs,QJs,JTs,T9s,98s,87s,76s,AJo',
  },
  SB_vs_LJ: {
    threeBet: 'TT+,AQs+,A5s,KQs,AQo+',
    call: '99-33,AJs,ATs,A9s,KJs,QJs,JTs,T9s,98s,87s,76s,65s,AJo',
  },
  SB_vs_HJ: {
    threeBet: '99+,AJs+,AQs+,A5s,KJs+,QJs,AQo+',
    call: '88-44,ATs,A9s,KTs,QTs,JTs,T9s,98s,87s,76s,65s,AJo',
  },
  SB_vs_CO: {
    threeBet: '99+,AQs+,A5s,A4s,KJs+,QJs,JTs,T9s,AQo+',
    call: '88-44,AJs,ATs,A9s,A8s,A7s,A6s,KTs,QTs,98s,87s,76s,65s,AJo,KQo,QJo,JTo',
  },
  SB_vs_BTN: {
    threeBet: '88+,AQs+,A5s,A4s,KJs+,QJs,JTs,T9s,98s,AQo+',
    call: '77-44,AJs,ATs,A9s,A8s,A7s,A6s,KTs,K9s,QTs,J9s,T8s,87s,76s,65s,AJo,KQo,QJo,JTo',
  },

  BB_vs_UTG: {
    threeBet: 'QQ+,AQs+,AKo',
    call: 'JJ-55,AJs,ATs,KQs,QJs,JTs,T9s,98s,87s,76s,AQo',
  },
  BB_vs_UTG1: {
    threeBet: 'JJ+,AQs+,AQo+',
    call: 'TT-44,AJs,ATs,KQs,KJs,QJs,JTs,T9s,98s,87s,76s,65s',
  },
  BB_vs_UTG2: {
    threeBet: 'TT+,AQs+,A5s,AQo+',
    call: '99-33,AJs,ATs,KQs,KJs,QJs,JTs,T9s,98s,87s,76s,65s,54s,AJo',
  },
  BB_vs_LJ: {
    threeBet: 'TT+,AQs+,A5s,KQs,AQo+',
    call: '99-22,AJs,ATs,A9s,KJs,QJs,JTs,T9s,98s,87s,76s,65s,54s,AJo',
  },
  BB_vs_HJ: {
    threeBet: '99+,AJs+,AQs+,A5s,A4s,KJs+,AQo+',
    call: '88-22,ATs,A9s,KTs,QTs,QJs,T9s,98s,87s,76s,65s,54s,AJo,KQo,QJo,JTs,JTo,T9o',
  },
  BB_vs_CO: {
    threeBet: '99+,AQs+,A5s,A4s,A3s,KJs+,QJs,JTs,T9s,AQo+',
    call: '88-22,AJs,ATs,A9s,A8s,A7s,A6s,A2s,KTs,K9s,K8s,QTs,Q9s,J9s,T8s,T9o,98s,97s,87s,86s,76s,75s,65s,64s,54s,53s,43s,AJo,ATo,KQo,KJo,QJo,QTo,JTo',
  },
  BB_vs_BTN: {
    threeBet: '66+,AKs,AKo,AQs,AQo,A5s,A4s,A3s,A2s,KQs,KJs,QJs,JTs,T9s,98s,87s,76s',
    call: '22,33,44,55,A6s,A7s,A8s,A9s,ATs,AJs,AJo,ATo,A9o,K7s,K8s,K9s,KTs,KJo,KQo,Q8s,Q9s,QTs,QJo,QTo,J8s,J9s,JTo,T8s,T7s,T9o,97s,96s,86s,85s,75s,65s,64s,54s,53s,43s',
  },
  BB_vs_SB: {
    threeBet: '88+,AKs,AKo,AQs,AQo,A5s,A4s,A3s,KQs,KJs,QJs',
    call: '77-22,AJs,ATs,A9s,A8s,A7s,A6s,A2s,KTs,K9s,K8s,QTs,Q9s,Q8s,JTs,J9s,J8s,T8s,T9s,T9o,98s,97s,87s,86s,76s,75s,65s,64s,54s,53s,43s,AJo,ATo,KQo,KJo,QJo,QTo,JTo',
  },
} as const;

export const FACING_OPEN_DEFAULTS_100BB = Object.fromEntries(
  Object.entries(RAW_FACING_OPEN_DEFAULTS_100BB).map(([matchupKey, ranges]) => {
    const [heroPos, villainPos] = matchupKey.split('_vs_');
    return [facingOpenKey(heroPos as FacingOpenHeroPosition, villainPos as Position), ranges];
  }),
);
