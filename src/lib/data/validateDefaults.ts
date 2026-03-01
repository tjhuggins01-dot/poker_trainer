import { parseRangeShorthand } from '../parser';
import { THREE_BET_DEFAULTS } from './cash9max/100/threeBet';
import { VS_ISO_DEFAULTS_SAFE, VS_LIMP_ISO_DEFAULTS } from './cash9max/100/limpBranch';

const noOverlap = (a: string[], b: string[]) => !a.some((h) => b.includes(h));

export const validateDefaultRanges = () => {
  const errors: string[] = [];

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
