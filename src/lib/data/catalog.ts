import { RFI_DEFAULTS_100BB } from './cash6max/100/rfi';
import { FACING_OPEN_DEFAULTS_100BB } from './cash6max/100/facingOpen';
import { THREE_BET_DEFAULTS } from './cash6max/100/threeBet';
import type { DrillFormat, EffectiveStackBb } from '../constants';

export type StackDataBundle = {
  rfi: typeof RFI_DEFAULTS_100BB;
  facingOpen: typeof FACING_OPEN_DEFAULTS_100BB;
  threeBet: typeof THREE_BET_DEFAULTS;
};

const CASH_6MAX_100BB: StackDataBundle = {
  rfi: RFI_DEFAULTS_100BB,
  facingOpen: FACING_OPEN_DEFAULTS_100BB,
  threeBet: THREE_BET_DEFAULTS,
};

const DATA_CATALOG: Record<DrillFormat, Partial<Record<EffectiveStackBb, StackDataBundle>>> = {
  cash6max: {
    100: CASH_6MAX_100BB,
  },
};

export const getStackDataBundle = (
  format: DrillFormat,
  stack: EffectiveStackBb,
): StackDataBundle | undefined => DATA_CATALOG[format]?.[stack];
