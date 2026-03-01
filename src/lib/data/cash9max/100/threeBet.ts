export const VS_3BET_DEFAULTS: Record<
  string,
  { fourBet: string; call: string }
> = {
  UTG_vs_HJ_3BET: { fourBet: 'QQ+,AKs,AKo', call: 'JJ,TT,AQs,AJs,KQs' },
  UTG_vs_CO_3BET: { fourBet: 'QQ+,AKs,AKo,AQs', call: 'JJ,TT,99,AJs,KQs,QJs,JTs' },
  UTG_vs_BTN_3BET: { fourBet: 'QQ+,AKs,AKo,AQs,AQo,A5s', call: 'JJ,TT,99,AJs,KQs,QJs,JTs,T9s' },
  UTG_vs_SB_3BET: { fourBet: 'QQ+,AKs,AKo,AQs,AQo,A5s', call: 'JJ,TT,99,AJs,KQs,QJs,JTs,T9s' },
  UTG_vs_BB_3BET: { fourBet: 'QQ+,AKs,AKo,AQs,AQo,A5s', call: 'JJ,TT,99,AJs,KQs,QJs,JTs,T9s' },

  UTG1_vs_HJ_3BET: { fourBet: 'QQ+,AKs,AKo', call: 'JJ,TT,99,AQs,AJs,KQs,QJs,JTs' },
  UTG1_vs_CO_3BET: { fourBet: 'QQ+,AKs,AKo', call: 'JJ,TT,99,AQs,AJs,KQs,QJs,JTs' },
  UTG1_vs_BTN_3BET: { fourBet: 'QQ+,AKs,AKo,AQs,AQo,A5s', call: 'JJ,TT,99,88,AJs,KQs,QJs,JTs,T9s,98s' },
  UTG1_vs_SB_3BET: { fourBet: 'QQ+,AKs,AKo,AQs,AQo,A5s', call: 'JJ,TT,99,88,AJs,KQs,QJs,JTs,T9s,98s' },
  UTG1_vs_BB_3BET: { fourBet: 'QQ+,AKs,AKo,AQs,AQo,A5s', call: 'JJ,TT,99,88,AJs,KQs,QJs,JTs,T9s,98s' },

  UTG2_vs_HJ_3BET: { fourBet: 'JJ+,AKs,AKo,AQs', call: 'TT,99,88,AJs,ATs,KQs,QJs,JTs,T9s,98s' },
  UTG2_vs_CO_3BET: { fourBet: 'JJ+,AKs,AKo,AQs', call: 'TT,99,88,AJs,ATs,KQs,QJs,JTs,T9s,98s' },
  UTG2_vs_BTN_3BET: { fourBet: 'JJ+,AKs,AKo,AQs,AQo,A5s', call: 'TT,99,88,77,AJs,ATs,KQs,QJs,JTs,T9s,98s,87s' },
  UTG2_vs_SB_3BET: { fourBet: 'JJ+,AKs,AKo,AQs,AQo,A5s', call: 'TT,99,88,77,AJs,ATs,KQs,QJs,JTs,T9s,98s,87s' },
  UTG2_vs_BB_3BET: { fourBet: 'JJ+,AKs,AKo,AQs,AQo,A5s', call: 'TT,99,88,77,AJs,ATs,KQs,QJs,JTs,T9s,98s,87s' },

  LJ_vs_HJ_3BET: { fourBet: 'JJ+,AKs,AKo,AQs', call: 'TT,99,88,AJs,ATs,KQs,QJs,JTs,T9s,98s' },
  LJ_vs_CO_3BET: { fourBet: 'JJ+,AKs,AKo,AQs,AQo,A5s', call: 'TT,99,88,77,AJs,ATs,KQs,QJs,JTs,T9s,98s,87s' },
  LJ_vs_BTN_3BET: {
    fourBet: 'TT+,AKs,AKo,AQs,AQo,A5s,A4s',
    call: '99,88,77,66,AJs,ATs,AQo,KQs,QJs,JTs,T9s,98s,87s,76s',
  },
  LJ_vs_SB_3BET: {
    fourBet: 'TT+,AKs,AKo,AQs,AQo,A5s,A4s',
    call: '99,88,77,66,AJs,ATs,AQo,KQs,QJs,JTs,T9s,98s,87s,76s',
  },
  LJ_vs_BB_3BET: {
    fourBet: 'TT+,AKs,AKo,AQs,AQo,A5s,A4s',
    call: '99,88,77,66,AJs,ATs,AQo,KQs,QJs,JTs,T9s,98s,87s,76s',
  },

  HJ_vs_CO_3BET: {
    fourBet: 'TT+,AKs,AKo,AQs,AQo,A5s',
    call: '99,88,77,66,AJs,ATs,AQo,KQs,KJs,QJs,JTs,T9s,98s,87s',
  },
  HJ_vs_BTN_3BET: {
    fourBet: 'TT+,AKs,AKo,AQs,AQo,A5s,A4s,A3s',
    call: '99,88,77,66,55,AJs,ATs,AQo,KQs,KJs,QJs,JTs,T9s,98s,87s,76s',
  },
  HJ_vs_SB_3BET: {
    fourBet: 'TT+,AKs,AKo,AQs,AQo,A5s,A4s,A3s',
    call: '99,88,77,66,55,AJs,ATs,AQo,KQs,KJs,QJs,JTs,T9s,98s,87s,76s',
  },
  HJ_vs_BB_3BET: {
    fourBet: 'TT+,AKs,AKo,AQs,AQo,A5s,A4s,A3s',
    call: '99,88,77,66,55,AJs,ATs,AQo,KQs,KJs,QJs,JTs,T9s,98s,87s,76s',
  },

  CO_vs_BTN_3BET: {
    fourBet: 'TT+,AKs,AKo,AQs,AQo,A5s,A4s,A3s',
    call: '99,88,77,66,55,AJs,ATs,AQo,KQs,KJs,QJs,JTs,T9s,98s,87s,76s',
  },
  CO_vs_SB_3BET: {
    fourBet: 'TT+,AKs,AKo,AQs,AQo,A5s,A4s,A3s',
    call: '99,88,77,66,55,AJs,ATs,AQo,KQs,KJs,QJs,JTs,T9s,98s,87s,76s',
  },
  CO_vs_BB_3BET: {
    fourBet: 'TT+,AKs,AKo,AQs,AQo,A5s,A4s,A3s',
    call: '99,88,77,66,55,AJs,ATs,AQo,KQs,KJs,QJs,JTs,T9s,98s,87s,76s',
  },

  BTN_vs_SB_3BET: {
    fourBet: '99+,AKs,AKo,AQs,AQo,A5s,A4s,A3s,KQs',
    call: '88,77,66,55,44,AJs,ATs,AQo,AJo,KQs,KJs,QJs,JTs,T9s,98s,87s,76s,65s',
  },
  BTN_vs_BB_3BET: {
    fourBet: '99+,AKs,AKo,AQs,AQo,A5s,A4s,A3s,KQs',
    call: '88,77,66,55,44,AJs,ATs,AQo,AJo,KQs,KJs,QJs,JTs,T9s,98s,87s,76s,65s',
  },

  SB_vs_BB_3BET: {
    fourBet: '99+,AKs,AKo,AQs,AQo,A5s,A4s,KQs',
    call: '88,77,66,55,44,AJs,ATs,AQo,AJo,KQs,KJs,QJs,JTs,T9s,98s,87s,76s,65s',
  },
};

export const THREE_BET_DEFAULTS: Record<string, { call: string; fourBet: string }> = Object.fromEntries(
  Object.entries(VS_3BET_DEFAULTS).map(([key, value]) => [key.replace(/_3BET$/, '').replace('_vs_', '_VS_'), { call: value.call, fourBet: value.fourBet }]),
);
