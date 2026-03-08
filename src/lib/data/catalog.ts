import { FACING_OPEN_DEFAULTS_100BB } from './cash9max/100/facingOpen';
import { VS_ISO_DEFAULTS_SAFE as VS_ISO_DEFAULTS_SAFE_100BB, VS_LIMP_ISO_DEFAULTS as VS_LIMP_ISO_DEFAULTS_100BB } from './cash9max/100/limpBranch';
import { RFI_DEFAULTS_100BB } from './cash9max/100/rfi';
import { THREE_BET_DEFAULTS as THREE_BET_DEFAULTS_100BB } from './cash9max/100/threeBet';
import { FACING_OPEN_DEFAULTS_200BB } from './cash9max/200/facingOpen';
import { VS_ISO_DEFAULTS_SAFE as VS_ISO_DEFAULTS_SAFE_200BB, VS_LIMP_ISO_DEFAULTS as VS_LIMP_ISO_DEFAULTS_200BB } from './cash9max/200/limpBranch';
import { RFI_DEFAULTS_200BB } from './cash9max/200/rfi';
import { THREE_BET_DEFAULTS as THREE_BET_DEFAULTS_200BB } from './cash9max/200/threeBet';

export type StackDataBundle = {
  rfi: { raise: Record<string, string>; limp: { SB: string } };
  facingOpen: Record<string, { call: string; threeBet: string }>;
  threeBet: Record<string, { call: string; fourBet: string }>;
  limpIso: Record<string, { isoRaise: string }>;
  vsIso: Record<string, { threeBet: string; call: string }>;
};

const CASH9MAX_100_BUNDLE: StackDataBundle = {
  rfi: RFI_DEFAULTS_100BB,
  facingOpen: FACING_OPEN_DEFAULTS_100BB,
  threeBet: THREE_BET_DEFAULTS_100BB,
  limpIso: VS_LIMP_ISO_DEFAULTS_100BB,
  vsIso: VS_ISO_DEFAULTS_SAFE_100BB,
};

const CASH9MAX_200_BUNDLE: StackDataBundle = {
  rfi: RFI_DEFAULTS_200BB,
  facingOpen: FACING_OPEN_DEFAULTS_200BB,
  threeBet: THREE_BET_DEFAULTS_200BB,
  limpIso: VS_LIMP_ISO_DEFAULTS_200BB,
  vsIso: VS_ISO_DEFAULTS_SAFE_200BB,
};

export const getStackDataBundle = (format: string, stack: number): StackDataBundle | undefined => {
  if (format === 'cash9max' && stack === 100) return CASH9MAX_100_BUNDLE;
  if (format === 'cash9max' && stack === 200) return CASH9MAX_200_BUNDLE;
  return undefined;
};
