import { facingOpenKey } from '../../../presets';
import type { FacingOpenHeroPosition, Position } from '../../../types';

const RAW_FACING_OPEN_DEFAULTS_200BB = {
  UTG1_vs_UTG: { call: 'JJ,TT,AQs,AJs,KQs,QJs', threeBet: 'QQ+,AKs,AKo' },
  UTG2_vs_UTG: { call: 'JJ-99,AJs,ATs,KQs,QJs,JTs', threeBet: 'QQ+,AQs+,AKo' },
  UTG2_vs_UTG1: { call: 'JJ-99,AJs,ATs,KQs,QJs,JTs', threeBet: 'QQ+,AQs+,AKo' },
  LJ_vs_UTG: { call: 'JJ-66,AJs,KQs,QJs,JTs,T9s', threeBet: 'QQ+,AQs+,AKo' },
  LJ_vs_UTG1: { call: 'JJ-55,AJs,ATs,KQs,QJs,JTs,T9s', threeBet: 'QQ+,AQs+,AKo' },
  LJ_vs_UTG2: { call: 'TT-44,AJs,ATs,KQs,QJs,JTs,T9s', threeBet: 'JJ+,AQs+,AQo+' },
  HJ_vs_UTG: { call: 'JJ-66,AJs,KQs,QJs,JTs,T9s', threeBet: 'QQ+,AQs+,AKo' },
  HJ_vs_UTG1: { call: 'TT-55,AJs,ATs,KQs,QJs,JTs,T9s', threeBet: 'JJ+,AQs+,AKo' },
  HJ_vs_UTG2: { call: 'TT-44,AJs,ATs,KQs,QJs,JTs,T9s', threeBet: 'JJ+,AQs+,AQo+' },
  HJ_vs_LJ: { call: 'TT-33,AJs,ATs,KJs+,QJs,JTs,T9s', threeBet: 'JJ+,AQs+,AQo+' },
  CO_vs_UTG: { call: 'JJ-66,AJs,KQs,QJs,JTs,T9s', threeBet: 'QQ+,AQs+,AKo' },
  CO_vs_UTG1: { call: 'JJ-55,AJs,ATs,KQs,QJs,JTs,T9s,98s', threeBet: 'QQ+,AQs+,AKo' },
  CO_vs_UTG2: { call: 'TT-44,AJs,ATs,KQs,QJs,JTs,T9s,98s,87s', threeBet: 'JJ+,AQs+,AQo+' },
  CO_vs_LJ: { call: 'TT-33,AJs,ATs,KQs,QJs,JTs,T9s,98s,87s', threeBet: 'JJ+,AQs+,AQo+' },
  CO_vs_HJ: {
    call: '99-22,AJs,ATs,KJs+,QTs+,JTs,T9s,98s,87s,76s,65s,54s',
    threeBet: 'TT+,AQs+,A5s,A4s,AQo+',
  },
  BTN_vs_UTG: { call: 'JJ-55,AJs,KQs,QJs,JTs,T9s,98s,87s', threeBet: 'QQ+,AQs+,AKo' },
  BTN_vs_UTG1: { call: 'TT-44,AJs,ATs,KJs+,QJs,JTs,T9s,98s,87s,76s', threeBet: 'JJ+,AQs+,AKo' },
  BTN_vs_UTG2: { call: '99-33,AJs,ATs,KJs+,QJs,JTs,T9s,98s,87s,76s,65s', threeBet: 'TT+,AQs+,A5s,AQo+' },
  BTN_vs_LJ: { call: '99-22,AJs,ATs,A9s,KJs,QJs,JTs,T9s,98s,87s,76s,65s', threeBet: 'TT+,AQs+,A5s,KQs,AQo+' },
  BTN_vs_HJ: {
    call: '88-22,ATs,A9s,KTs,QTs+,JTs,T9s,98s,87s,76s,65s,54s,43s,AJo,KQo,QJo',
    threeBet: '99+,AJs+,A5s,A4s,A3s,KJs+,AQo+',
  },
  BTN_vs_CO: {
    call: '88-22,AJs,ATs,A9s,A8s,A7s,A6s,A2s,KTs,K9s,QTs,T9s,98s,87s,76s,65s,54s,43s,AJo,KQo,QJo,JTo,T9o',
    threeBet: '99+,AQs+,A5s,A4s,A3s,KJs+,QJs,JTs,AQo+',
  },
  SB_vs_UTG: { call: 'TT-66,AJs,KQs,QJs,JTs,T9s,98s', threeBet: 'JJ+,AQs+,AKo' },
  SB_vs_UTG1: { call: 'TT-55,AJs,ATs,KQs,QJs,JTs,T9s,98s,87s', threeBet: 'JJ+,AQs+,AKo' },
  SB_vs_UTG2: { call: '99-44,AJs,ATs,KQs,QJs,JTs,T9s,98s,87s,76s', threeBet: 'TT+,AQs+,A5s,AQo+' },
  SB_vs_LJ: { call: '99-33,AJs,ATs,A9s,KJs,QJs,JTs,T9s,98s,87s,76s,65s', threeBet: 'TT+,AQs+,A5s,KQs,AQo+' },
  SB_vs_HJ: {
    call: '88-44,ATs,A9s,KTs,QTs,JTs,T9s,98s,87s,76s,65s,AJo',
    threeBet: '99+,AJs+,A5s,KJs+,QJs,AQo+',
  },
  SB_vs_CO: {
    call: '88-44,AJs,ATs,A9s,A8s,A7s,A6s,KTs,QTs,98s,87s,76s,65s,AJo,KQo,QJo,JTo',
    threeBet: '99+,AQs+,A5s,A4s,KJs+,QJs,JTs,T9s,AQo+',
  },
  SB_vs_BTN: {
    call: '77-44,AJs,ATs,A9s,A8s,A7s,A6s,KTs,K9s,QTs,J9s,T8s,87s,76s,65s,54s,AJo,KQo,QJo,JTo',
    threeBet: '88+,AQs+,A5s,A4s,A3s,KJs+,QJs,JTs,T9s,98s,AQo+',
  },
  BB_vs_UTG: { call: 'JJ-55,AJs,ATs,KQs,QJs,JTs,T9s,98s,87s,76s', threeBet: 'QQ+,AQs+,AKo' },
  BB_vs_UTG1: { call: 'TT-44,AJs,ATs,KJs+,QJs,JTs,T9s,98s,87s,76s,65s', threeBet: 'JJ+,AQs+,AKo' },
  BB_vs_UTG2: { call: '99-33,AJs,ATs,KJs+,QJs,JTs,T9s,98s,87s,76s,65s,54s', threeBet: 'TT+,AQs+,A5s,AQo+' },
  BB_vs_LJ: { call: '99-22,AJs,ATs,A9s,KJs,QJs,JTs,T9s,98s,87s,76s,65s,54s', threeBet: 'TT+,AQs+,A5s,KQs,AQo+' },
  BB_vs_HJ: {
    call: '88-22,ATs,A9s,KTs,QTs+,JTs,T9s,98s,87s,76s,65s,54s,AJo,KQo,QJo,JTo,T9o',
    threeBet: '99+,AJs+,A5s,A4s,KJs+,AQo+',
  },
  BB_vs_CO: {
    call: '88-22,AJs,ATs,A9s,A8s,A7s,A6s,A2s,KTs,K9s,K8s,QTs,Q9s,J9s,T8s,97s+,86s+,75s+,64s+,53s+,42s+,AJo,ATo,KJo+,QTo+,JTo,T9o',
    threeBet: '99+,AQs+,A5s,A4s,A3s,KJs+,QJs,JTs,T9s,AQo+,A5o',
  },
  BB_vs_BTN: {
    call: '55-22,AJs,ATs,A9s,A8s,A7s,A6s,K9s,K8s,K7s,QTs,Q9s,Q8s,J9s,J8s,T8s,T7s,97s,96s,86s,85s,75s,64s+,53s+,42s+,32s,AJo,ATo,A9o,KJo+,QTo+,JTo,T9o',
    threeBet: '66+,AQs+,A5s,A4s,A3s,A2s,KTs+,QJs,JTs,T9s,98s,87s,76s,AQo+,A5o',
  },
  BB_vs_SB: {
    call: '77-22,AJs,ATs,A9s,A8s,A7s,A6s,KTs,K9s,K8s,QTs,Q9s,Q8s,J8s+,T8s+,97s+,86s+,75s+,64s+,53s+,42s+,AJo,ATo,KJo+,QTo+,JTo,T9o',
    threeBet: '88+,AQs+,A5s,A4s,A3s,A2s,KJs+,QJs,AQo+',
  },
} as const;

export const FACING_OPEN_DEFAULTS_200BB = Object.fromEntries(
  Object.entries(RAW_FACING_OPEN_DEFAULTS_200BB).map(([matchupKey, ranges]) => {
    const [heroPos, villainPos] = matchupKey.split('_vs_');
    return [facingOpenKey(heroPos as FacingOpenHeroPosition, villainPos as Position), ranges];
  }),
);
