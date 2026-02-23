export const THREE_BET_DEFAULTS: Record<string, { call: string; fourBet: string }> = {
  CO_VS_BTN: {
    call: '77,88,99,TT,JJ,AQs,AJs,KQs,QJs,JTs,T9s',
    fourBet: 'QQ,KK,AA,AKs,AKo,A5s',
  },
  BTN_VS_SB: {
    call: '66,77,88,99,TT,JJ,AQs,AJs,ATs,KQs,QJs,JTs,T9s,98s',
    fourBet: 'QQ,KK,AA,AKs,AKo,A5s,A4s',
  },
  SB_VS_BB: {
    call: '77,88,99,TT,JJ,AQs,AJs,ATs,KQs,QJs,JTs,T9s,98s',
    fourBet: 'QQ,KK,AA,AKs,AKo,A5s',
  },
};
