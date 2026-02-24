import { getStackDataBundle } from '../../lib/data/catalog';
import type { DrillContext } from '../../lib/domain';
import { parseRangeShorthand } from '../../lib/parser';
import { PRESETS, facingOpenKey, type PresetId } from '../../lib/presets';
import {
  RFI_POSITIONS,
  type AppData,
  type FacingOpenHeroPosition,
  type Position,
  type RfiPosition,
  type ThreeBetHeroPosition,
} from '../../lib/types';
import { makeFacingOpenKey, makeLimpIsoKey, makeRfiKey, makeThreeBetKey, makeVsIsoKey } from '../storage/keys';

const hasNoOverlap = (a: string[], b: string[]) => !a.some((hand) => b.includes(hand));

export type PresetApplyMode = 'rfi' | 'facing_open' | 'three_bet' | 'limp_branch';

export type PresetSpot = {
  rfiPosition?: RfiPosition;
  heroPos?: FacingOpenHeroPosition | ThreeBetHeroPosition | 'BB' | 'SB';
  villainPos?: Position;
};

export const applyPresetToAllRanges = (data: AppData, presetId: PresetId, context: DrillContext): AppData => {
  const next = structuredClone(data);
  const preset = PRESETS[presetId];
  const bundle = getStackDataBundle(context.format, context.effectiveStackBb);

  RFI_POSITIONS.forEach((pos) => {
    const parsedRaise = parseRangeShorthand(preset.rfi.raise[pos]);
    const key = makeRfiKey(pos, context.format, context.effectiveStackBb);
    if (parsedRaise.ok && next.situations[key]) (next.situations[key].policy as any).raise = parsedRaise.hands;
  });

  const parsedSbLimp = parseRangeShorthand(preset.rfi.limp.SB);
  const sbKey = makeRfiKey('SB', context.format, context.effectiveStackBb);
  if (parsedSbLimp.ok && next.situations[sbKey]) (next.situations[sbKey].policy as any).limp = parsedSbLimp.hands;

  Object.entries(preset.facingOpen).forEach(([k, v]) => {
    const [hero, villain] = k.replace('FO_', '').split('_VS_');
    const key = makeFacingOpenKey(hero as FacingOpenHeroPosition, villain as Position, context.format, context.effectiveStackBb);
    const call = parseRangeShorthand(v.call);
    const threeBet = parseRangeShorthand(v.threeBet);
    if (!call.ok || !threeBet.ok || !hasNoOverlap(call.hands, threeBet.hands) || !next.situations[key]) return;
    (next.situations[key].policy as any).call = call.hands;
    (next.situations[key].policy as any).threeBet = threeBet.hands;
  });

  Object.entries(bundle?.threeBet ?? {}).forEach(([k, v]) => {
    const [hero, villain] = k.split('_VS_');
    const key = makeThreeBetKey(hero as ThreeBetHeroPosition, villain as Position, context.format, context.effectiveStackBb);
    const call = parseRangeShorthand(v.call);
    const fourBet = parseRangeShorthand(v.fourBet);
    if (!call.ok || !fourBet.ok || !hasNoOverlap(call.hands, fourBet.hands) || !next.situations[key]) return;
    (next.situations[key].policy as any).call = call.hands;
    (next.situations[key].policy as any).fourBet = fourBet.hands;
  });

  const limpIso = bundle?.limpIso.BB_vs_SB_LIMP;
  const vsIso = bundle?.vsIso.SB_vs_BB_ISO;
  if (limpIso) {
    const parsedIso = parseRangeShorthand(limpIso.isoRaise);
    const key = makeLimpIsoKey(context.format, context.effectiveStackBb);
    if (parsedIso.ok && next.situations[key]) (next.situations[key].policy as any).isoRaise = parsedIso.hands;
  }
  if (vsIso) {
    const call = parseRangeShorthand(vsIso.call);
    const threeBet = parseRangeShorthand(vsIso.threeBet);
    const key = makeVsIsoKey(context.format, context.effectiveStackBb);
    if (call.ok && threeBet.ok && hasNoOverlap(call.hands, threeBet.hands) && next.situations[key]) {
      (next.situations[key].policy as any).call = call.hands;
      (next.situations[key].policy as any).threeBet = threeBet.hands;
    }
  }

  return next;
};

export const applyPresetToSpot = (
  data: AppData,
  mode: PresetApplyMode,
  spot: PresetSpot,
  presetId: PresetId,
  context: DrillContext,
): AppData => {
  const next = structuredClone(data);
  const preset = PRESETS[presetId];

  if (mode === 'rfi' && spot.rfiPosition) {
    const key = makeRfiKey(spot.rfiPosition, context.format, context.effectiveStackBb);
    const parsedRaise = parseRangeShorthand(preset.rfi.raise[spot.rfiPosition]);
    if (parsedRaise.ok && next.situations[key]) (next.situations[key].policy as any).raise = parsedRaise.hands;
    if (spot.rfiPosition === 'SB') {
      const parsedLimp = parseRangeShorthand(preset.rfi.limp.SB);
      if (parsedLimp.ok && next.situations[key]) (next.situations[key].policy as any).limp = parsedLimp.hands;
    }
    return next;
  }

  if (mode === 'facing_open' && spot.heroPos && spot.villainPos) {
    const key = makeFacingOpenKey(spot.heroPos as FacingOpenHeroPosition, spot.villainPos, context.format, context.effectiveStackBb);
    const matchup = preset.facingOpen[facingOpenKey(spot.heroPos as FacingOpenHeroPosition, spot.villainPos)];
    if (!matchup || !next.situations[key]) return next;
    const call = parseRangeShorthand(matchup.call);
    const threeBet = parseRangeShorthand(matchup.threeBet);
    if (call.ok && threeBet.ok && hasNoOverlap(call.hands, threeBet.hands)) {
      (next.situations[key].policy as any).call = call.hands;
      (next.situations[key].policy as any).threeBet = threeBet.hands;
    }
    return next;
  }

  if (mode === 'three_bet' && spot.heroPos && spot.villainPos) {
    const bundle = getStackDataBundle(context.format, context.effectiveStackBb);
    const key = makeThreeBetKey(spot.heroPos as ThreeBetHeroPosition, spot.villainPos, context.format, context.effectiveStackBb);
    const matchup = bundle?.threeBet[`${spot.heroPos}_VS_${spot.villainPos}`];
    if (!matchup || !next.situations[key]) return next;
    const call = parseRangeShorthand(matchup.call);
    const fourBet = parseRangeShorthand(matchup.fourBet);
    if (call.ok && fourBet.ok && hasNoOverlap(call.hands, fourBet.hands)) {
      (next.situations[key].policy as any).call = call.hands;
      (next.situations[key].policy as any).fourBet = fourBet.hands;
    }
    return next;
  }

  if (mode === 'limp_branch' && spot.heroPos) {
    const bundle = getStackDataBundle(context.format, context.effectiveStackBb);
    if (spot.heroPos === 'BB') {
      const matchup = bundle?.limpIso.BB_vs_SB_LIMP;
      const key = makeLimpIsoKey(context.format, context.effectiveStackBb);
      if (!matchup || !next.situations[key]) return next;
      const iso = parseRangeShorthand(matchup.isoRaise);
      if (iso.ok) (next.situations[key].policy as any).isoRaise = iso.hands;
      return next;
    }
    const matchup = bundle?.vsIso.SB_vs_BB_ISO;
    const key = makeVsIsoKey(context.format, context.effectiveStackBb);
    if (!matchup || !next.situations[key]) return next;
    const call = parseRangeShorthand(matchup.call);
    const threeBet = parseRangeShorthand(matchup.threeBet);
    if (call.ok && threeBet.ok && hasNoOverlap(call.hands, threeBet.hands)) {
      (next.situations[key].policy as any).call = call.hands;
      (next.situations[key].policy as any).threeBet = threeBet.hands;
    }
  }

  return next;
};
