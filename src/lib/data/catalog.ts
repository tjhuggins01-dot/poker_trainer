import { FACING_OPEN_DEFAULTS_100BB } from './cash9max/100/facingOpen';
import { RFI_DEFAULTS_100BB } from './cash9max/100/rfi';
import { THREE_BET_DEFAULTS } from './cash9max/100/threeBet';
import { VS_ISO_DEFAULTS_SAFE, VS_LIMP_ISO_DEFAULTS } from './cash9max/100/limpBranch';
import { FACING_OPEN_DEFAULTS_200BB } from './cash9max/200/facingOpen';
import { RFI_DEFAULTS_200BB } from './cash9max/200/rfi';

export type StackDataBundle = {
  rfi: typeof RFI_DEFAULTS_100BB;
  facingOpen: typeof FACING_OPEN_DEFAULTS_100BB;
  threeBet: typeof THREE_BET_DEFAULTS;
  limpIso: typeof VS_LIMP_ISO_DEFAULTS;
  vsIso: typeof VS_ISO_DEFAULTS_SAFE;
};

const CASH9MAX_100_BUNDLE: StackDataBundle = {
  rfi: RFI_DEFAULTS_100BB,
  facingOpen: FACING_OPEN_DEFAULTS_100BB,
  threeBet: THREE_BET_DEFAULTS,
  limpIso: VS_LIMP_ISO_DEFAULTS,
  vsIso: VS_ISO_DEFAULTS_SAFE,
};

const CASH9MAX_200_BUNDLE: StackDataBundle = {
  rfi: RFI_DEFAULTS_200BB,
  facingOpen: FACING_OPEN_DEFAULTS_200BB,
  threeBet: THREE_BET_DEFAULTS,
  limpIso: VS_LIMP_ISO_DEFAULTS,
  vsIso: VS_ISO_DEFAULTS_SAFE,
};

export const getStackDataBundle = (format: string, stack: number): StackDataBundle | undefined => {
  if (format === 'cash9max' && stack === 100) return CASH9MAX_100_BUNDLE;
  if (format === 'cash9max' && stack === 200) return CASH9MAX_200_BUNDLE;
  return undefined;
};
