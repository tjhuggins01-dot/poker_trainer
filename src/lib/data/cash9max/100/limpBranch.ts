export const VS_LIMP_ISO_DEFAULTS: Record<string, { isoRaise: string }> = {
  BB_vs_SB_LIMP: {
    isoRaise: '22+,A7s+,KTs+,QTs+,JTs,T9s,98s,87s,76s,ATo+,KJo+,QJo,JTo',
  },
};

export const VS_ISO_DEFAULTS_SAFE: Record<string, { threeBet: string; call: string }> = {
  SB_vs_BB_ISO: {
    threeBet: 'QQ+,AKs,AKo,AQs,AQo,A5s',
    call:
      '22,33,44,55,66,77,88,99,TT,JJ,A2s,A3s,A4s,A6s,A7s,A8s,A9s,ATs,AJs,K9s+,Q9s+,J9s+,T9s,98s,87s,76s,65s,AJo,KQo,QJo,JTo',
  },
};
