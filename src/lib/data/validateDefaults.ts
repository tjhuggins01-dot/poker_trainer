import { parseRangeShorthand } from '../parser';
import { DEFAULT_FORMAT, DEFAULT_STACK_BB, type DrillFormat, type EffectiveStackBb } from '../constants';
import { getStackDataBundle } from './catalog';
import { THREE_BET_DEFAULTS } from './cash9max/100/threeBet';
import { VS_ISO_DEFAULTS_SAFE, VS_LIMP_ISO_DEFAULTS } from './cash9max/100/limpBranch';

const noOverlap = (a: string[], b: string[]) => !a.some((h) => b.includes(h));

type ValidateDefaultsInput = {
  format?: DrillFormat;
  stack?: EffectiveStackBb;
};

export const validateDefaultRanges = ({
  format = DEFAULT_FORMAT,
  stack = DEFAULT_STACK_BB,
}: ValidateDefaultsInput = {}) => {
  const errors: string[] = [];
  const bundle = getStackDataBundle(format, stack);
  const facingOpenSource = bundle?.facingOpen;

  if (!facingOpenSource) {
    errors.push(`[facingOpen] missing default source for format=${format} stack=${stack}`);
  } else {
    Object.entries(facingOpenSource).forEach(([k, v]) => {
      const call = parseRangeShorthand(v.call);
      const threeBet = parseRangeShorthand(v.threeBet);
      if (!call.ok) errors.push(`[facingOpen:${k}] call parse error: ${call.error}`);
      if (!threeBet.ok) errors.push(`[facingOpen:${k}] threeBet parse error: ${threeBet.error}`);
      if (call.ok && threeBet.ok && !noOverlap(call.hands, threeBet.hands)) {
        errors.push(`[facingOpen:${k}] overlap between call and threeBet`);
      }
    });
  }

  Object.entries(THREE_BET_DEFAULTS).forEach(([k, v]) => {
    const call = parseRangeShorthand(v.call);
    const fourBet = parseRangeShorthand(v.fourBet);
    if (!call.ok) errors.push(`[threeBet:${k}] call parse error: ${call.error}`);
    if (!fourBet.ok) errors.push(`[threeBet:${k}] fourBet parse error: ${fourBet.error}`);
    if (call.ok && fourBet.ok && !noOverlap(call.hands, fourBet.hands)) {
      errors.push(`[threeBet:${k}] overlap between call and fourBet`);
    }
  });

  Object.entries(VS_LIMP_ISO_DEFAULTS).forEach(([k, v]) => {
    const iso = parseRangeShorthand(v.isoRaise);
    if (!iso.ok) errors.push(`[limpIso:${k}] isoRaise parse error: ${iso.error}`);
  });

  Object.entries(VS_ISO_DEFAULTS_SAFE).forEach(([k, v]) => {
    const call = parseRangeShorthand(v.call);
    const threeBet = parseRangeShorthand(v.threeBet);
    if (!call.ok) errors.push(`[vsIso:${k}] call parse error: ${call.error}`);
    if (!threeBet.ok) errors.push(`[vsIso:${k}] threeBet parse error: ${threeBet.error}`);
    if (call.ok && threeBet.ok && !noOverlap(call.hands, threeBet.hands)) {
      errors.push(`[vsIso:${k}] overlap between call and threeBet`);
    }
  });

  if (errors.length && typeof window !== 'undefined') {
    console.error('Default range validation failed:', errors);
  }

  return { ok: errors.length === 0, errors };
};
