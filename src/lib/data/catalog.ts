import { FACING_OPEN_DEFAULTS_100BB } from './cash6max/100/facingOpen';
import { RFI_DEFAULTS_100BB } from './cash6max/100/rfi';
import { THREE_BET_DEFAULTS } from './cash6max/100/threeBet';
import { VS_ISO_DEFAULTS_SAFE, VS_LIMP_ISO_DEFAULTS } from './cash6max/100/limpBranch';

export type StackDataBundle = {
  rfi: typeof RFI_DEFAULTS_100BB;
  facingOpen: typeof FACING_OPEN_DEFAULTS_100BB;
  threeBet: typeof THREE_BET_DEFAULTS;
  limpIso: typeof VS_LIMP_ISO_DEFAULTS;
  vsIso: typeof VS_ISO_DEFAULTS_SAFE;
};

const CASH6MAX_100_BUNDLE: StackDataBundle = {
  rfi: RFI_DEFAULTS_100BB,
  facingOpen: FACING_OPEN_DEFAULTS_100BB,
  threeBet: THREE_BET_DEFAULTS,
  limpIso: VS_LIMP_ISO_DEFAULTS,
  vsIso: VS_ISO_DEFAULTS_SAFE,
};

export const getStackDataBundle = (format: string, stack: number): StackDataBundle | undefined => {
  if (format === 'cash6max' && stack === 100) return CASH6MAX_100_BUNDLE;
  return undefined;
};
