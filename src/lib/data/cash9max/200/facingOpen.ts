import { facingOpenKey } from '../../../presets';
import type { FacingOpenHeroPosition, Position } from '../../../types';

const RAW_FACING_OPEN_DEFAULTS_200BB = {
  UTG1_vs_UTG: { call: 'AQs,AJs,KQs,QJs,JJ,TT', threeBet: 'AA,AKs,AKo,KK,QQ' },
  UTG2_vs_UTG: { call: 'AJs,ATs,KQs,QJs,JJ,JTs,TT,99', threeBet: 'AA,AKs,AKo,AQs,KK,QQ' },
  UTG2_vs_UTG1: { call: 'AJs,ATs,KQs,QJs,JJ,JTs,TT,99', threeBet: 'AA,AKs,AKo,AQs,KK,QQ' },
  LJ_vs_UTG: { call: 'AJs,KQs,QJs,JJ,JTs,TT,T9s,99,88,77,66', threeBet: 'AA,AKs,AKo,AQs,KK,QQ' },
  LJ_vs_UTG1: { call: 'AJs,ATs,KQs,QJs,JJ,JTs,TT,T9s,99,88,77,66,55', threeBet: 'AA,AKs,AKo,AQs,KK,QQ' },
  LJ_vs_UTG2: { call: 'AJs,ATs,KQs,QJs,JTs,TT,T9s,99,88,77,66,55,44', threeBet: 'AA,AKs,AKo,AQs,AQo,KK,QQ,JJ' },
  HJ_vs_UTG: { call: 'AJs,KQs,QJs,JJ,JTs,TT,T9s,99,88,77,66', threeBet: 'AA,AKs,AKo,AQs,KK,QQ' },
  HJ_vs_UTG1: { call: 'AJs,ATs,KQs,QJs,JTs,TT,T9s,99,88,77,66,55', threeBet: 'AA,AKs,AKo,AQs,KK,QQ,JJ' },
  HJ_vs_UTG2: { call: 'AJs,ATs,KQs,QJs,JTs,TT,T9s,99,88,77,66,55,44', threeBet: 'AA,AKs,AKo,AQs,AQo,KK,QQ,JJ' },
  HJ_vs_LJ: { call: 'AJs,ATs,KQs,KJs,QJs,JTs,TT,T9s,99,88,77,66,55,44,33', threeBet: 'AA,AKs,AKo,AQs,AQo,KK,QQ,JJ' },
  CO_vs_UTG: { call: 'AJs,KQs,QJs,JJ,JTs,TT,T9s,99,88,77,66', threeBet: 'AA,AKs,AKo,AQs,KK,QQ' },
  CO_vs_UTG1: { call: 'AJs,ATs,KQs,QJs,JJ,JTs,TT,T9s,99,98s,88,77,66,55', threeBet: 'AA,AKs,AKo,AQs,KK,QQ' },
  CO_vs_UTG2: { call: 'AJs,ATs,KQs,QJs,JTs,TT,T9s,99,98s,88,87s,77,66,55,44', threeBet: 'AA,AKs,AKo,AQs,AQo,KK,QQ,JJ' },
  CO_vs_LJ: { call: 'AJs,ATs,KQs,QJs,JTs,TT,T9s,99,98s,88,87s,77,66,55,44,33', threeBet: 'AA,AKs,AKo,AQs,AQo,KK,QQ,JJ' },
  CO_vs_HJ: {
    call: 'AJs,ATs,KQs,KJs,QJs,QTs,JTs,T9s,99,98s,88,87s,77,76s,66,65s,55,54s,44,33,22',
    threeBet: 'AA,AKs,AKo,AQs,AQo,A5s,A4s,KK,QQ,JJ,TT',
  },
  BTN_vs_UTG: { call: 'AJs,KQs,QJs,JJ,JTs,TT,T9s,99,98s,88,87s,77,66,55', threeBet: 'AA,AKs,AKo,AQs,KK,QQ' },
  BTN_vs_UTG1: { call: 'AJs,ATs,KQs,KJs,QJs,JTs,TT,T9s,99,98s,88,87s,77,76s,66,55,44', threeBet: 'AA,AKs,AKo,AQs,KK,QQ,JJ' },
  BTN_vs_UTG2: { call: 'AJs,ATs,KQs,KJs,QJs,JTs,T9s,99,98s,88,87s,77,76s,66,65s,55,44,33', threeBet: 'AA,AKs,AKo,AQs,AQo,A5s,KK,QQ,JJ,TT' },
  BTN_vs_LJ: { call: 'AJs,ATs,A9s,KJs,QJs,JTs,T9s,99,98s,88,87s,77,76s,66,65s,55,44,33,22', threeBet: 'AA,AKs,AKo,AQs,AQo,A5s,KK,KQs,QQ,JJ,TT' },
  BTN_vs_HJ: {
    call: 'AJo,ATs,A9s,KQo,KTs,QJs,QJo,QTs,JTs,T9s,98s,88,87s,77,76s,66,65s,55,54s,44,43s,33,22',
    threeBet: 'AA,AKs,AKo,AQs,AQo,AJs,A5s,A4s,A3s,KK,KQs,KJs,QQ,JJ,TT,99',
  },
  BTN_vs_CO: {
    call: 'AJs,AJo,ATs,A9s,A8s,A7s,A6s,A2s,KQo,KTs,K9s,QJo,QTs,JTo,T9s,T9o,98s,88,87s,77,76s,66,65s,55,54s,44,43s,33,22',
    threeBet: 'AA,AKs,AKo,AQs,AQo,A5s,A4s,A3s,KK,KQs,KJs,QQ,QJs,JJ,JTs,TT,99',
  },
  SB_vs_UTG: { call: 'AJs,KQs,QJs,JTs,TT,T9s,99,98s,88,77,66', threeBet: 'AA,AKs,AKo,AQs,KK,QQ,JJ' },
  SB_vs_UTG1: { call: 'AJs,ATs,KQs,QJs,JTs,TT,T9s,99,98s,88,87s,77,66,55', threeBet: 'AA,AKs,AKo,AQs,KK,QQ,JJ' },
  SB_vs_UTG2: { call: 'AJs,ATs,KQs,QJs,JTs,T9s,99,98s,88,87s,77,76s,66,55,44', threeBet: 'AA,AKs,AKo,AQs,AQo,A5s,KK,QQ,JJ,TT' },
  SB_vs_LJ: { call: 'AJs,ATs,A9s,KJs,QJs,JTs,T9s,99,98s,88,87s,77,76s,66,65s,55,44,33', threeBet: 'AA,AKs,AKo,AQs,AQo,A5s,KK,KQs,QQ,JJ,TT' },
  SB_vs_HJ: {
    call: 'AJo,ATs,A9s,KTs,QTs,JTs,T9s,98s,88,87s,77,76s,66,65s,55,44',
    threeBet: 'AA,AKs,AKo,AQs,AQo,AJs,A5s,KK,KQs,KJs,QQ,QJs,JJ,TT,99',
  },
  SB_vs_CO: {
    call: 'AJs,AJo,ATs,A9s,A8s,A7s,A6s,KQo,KTs,QJo,QTs,JTo,98s,88,87s,77,76s,66,65s,55,44',
    threeBet: 'AA,AKs,AKo,AQs,AQo,A5s,A4s,KK,KQs,KJs,QQ,QJs,JJ,JTs,TT,T9s,99',
  },
  SB_vs_BTN: {
    call: 'AJs,AJo,ATs,A9s,A8s,A7s,A6s,KQo,KTs,K9s,QJo,QTs,JTo,J9s,T8s,87s,77,76s,66,65s,55,54s,44',
    threeBet: 'AA,AKs,AKo,AQs,AQo,A5s,A4s,A3s,KK,KQs,KJs,QQ,QJs,JJ,JTs,TT,T9s,99,98s,88',
  },
  BB_vs_UTG: { call: 'AJs,ATs,KQs,QJs,JJ,JTs,TT,T9s,99,98s,88,87s,77,76s,66,55', threeBet: 'AA,AKs,AKo,AQs,KK,QQ' },
  BB_vs_UTG1: { call: 'AJs,ATs,KQs,KJs,QJs,JTs,TT,T9s,99,98s,88,87s,77,76s,66,65s,55,44', threeBet: 'AA,AKs,AKo,AQs,KK,QQ,JJ' },
  BB_vs_UTG2: { call: 'AJs,ATs,KQs,KJs,QJs,JTs,T9s,99,98s,88,87s,77,76s,66,65s,55,54s,44,33', threeBet: 'AA,AKs,AKo,AQs,AQo,A5s,KK,QQ,JJ,TT' },
  BB_vs_LJ: { call: 'AJs,ATs,A9s,KJs,QJs,JTs,T9s,99,98s,88,87s,77,76s,66,65s,55,54s,44,33,22', threeBet: 'AA,AKs,AKo,AQs,AQo,A5s,KK,KQs,QQ,JJ,TT' },
  BB_vs_HJ: {
    call: 'AJo,ATs,A9s,KQo,KTs,QJs,QJo,QTs,JTs,JTo,T9s,T9o,98s,88,87s,77,76s,66,65s,55,54s,44,33,22',
    threeBet: 'AA,AKs,AKo,AQs,AQo,AJs,A5s,A4s,KK,KQs,KJs,QQ,JJ,TT,99',
  },
  BB_vs_CO: {
    call: 'AJs,AJo,ATs,ATo,A9s,A8s,A7s,A6s,A2s,KQo,KJo,KTs,K9s,K8s,QJo,QTs,QTo,Q9s,JTo,J9s,T9o,T8s,98s,97s,88,87s,86s,77,76s,75s,66,65s,64s,55,54s,53s,44,43s,42s,33,22',
    threeBet: 'AA,AKs,AKo,AQs,AQo,A5s,A5o,A4s,A3s,KK,KQs,KJs,QQ,QJs,JJ,JTs,TT,T9s,99',
  },
  BB_vs_BTN: {
    call: 'AJs,AJo,ATs,ATo,A9s,A9o,A8s,A7s,A6s,KQo,KJo,K9s,K8s,K7s,QJo,QTs,QTo,Q9s,Q8s,JTo,J9s,J8s,T9o,T8s,T7s,97s,96s,86s,85s,75s,65s,64s,55,54s,53s,44,43s,42s,33,32s,22',
    threeBet: 'AA,AKs,AKo,AQs,AQo,A5s,A5o,A4s,A3s,A2s,KK,KQs,KJs,KTs,QQ,QJs,JJ,JTs,TT,T9s,99,98s,88,87s,77,76s,66',
  },
  BB_vs_SB: {
    call: 'AJs,AJo,ATs,ATo,A9s,A8s,A7s,A6s,KQo,KJo,KTs,K9s,K8s,QJo,QTs,QTo,Q9s,Q8s,JTs,JTo,J9s,J8s,T9s,T9o,T8s,98s,97s,87s,86s,77,76s,75s,66,65s,64s,55,54s,53s,44,43s,42s,33,22',
    threeBet: 'AA,AKs,AKo,AQs,AQo,A5s,A4s,A3s,A2s,KK,KQs,KJs,QQ,QJs,JJ,TT,99,88',
  },
} as const;

export const FACING_OPEN_DEFAULTS_200BB = Object.fromEntries(
  Object.entries(RAW_FACING_OPEN_DEFAULTS_200BB).map(([matchupKey, ranges]) => {
    const [heroPos, villainPos] = matchupKey.split('_vs_');
    return [facingOpenKey(heroPos as FacingOpenHeroPosition, villainPos as Position), ranges];
  }),
);
