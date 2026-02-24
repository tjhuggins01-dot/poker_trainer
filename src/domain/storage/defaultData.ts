import { getStackDataBundle } from '../../lib/data/catalog';
import { DEFAULT_FORMAT, DEFAULT_STACK_BB, type DrillFormat, type EffectiveStackBb } from '../../lib/constants';
import { parseRangeShorthand } from '../../lib/parser';
import { PRESETS, type PresetId } from '../../lib/presets';
import {
  FACING_OPEN_HERO_POSITIONS,
  FACING_OPEN_VILLAIN_BY_HERO,
  RFI_POSITIONS,
  STORAGE_VERSION,
  type AppData,
  type FacingOpenHeroPosition,
  type Position,
  THREE_BET_HERO_POSITIONS,
  type RfiPosition,
  type HandClass,
  type SessionStats,
  type ThreeBetHeroPosition,
  type RfiSituationPolicyRecord,
  type FacingOpenSituationPolicyRecord,
  type ThreeBetSituationPolicyRecord,
} from '../../lib/types';
import { DEFAULT_DRILL_CONTEXT } from '../../lib/domain';
import { makeFacingOpenKey, makeRfiKey, makeThreeBetKey } from './keys';

const defaultPresetId: PresetId = 'v2_standard';

export const createEmptyRfiStats = () =>
  Object.fromEntries(RFI_POSITIONS.map((p) => [p, { attempts: 0, correct: 0 }])) as Record<
    RfiPosition,
    { attempts: number; correct: number }
  >;

export const createEmptyFacingStats = () =>
  Object.fromEntries(
    FACING_OPEN_HERO_POSITIONS.map((p) => [p, { attempts: 0, correct: 0 }]),
  ) as Record<FacingOpenHeroPosition, { attempts: number; correct: number }>;

export const defaultFacingOpenSelection = {
  heroPos: 'UTG1' as FacingOpenHeroPosition,
  villainPos: FACING_OPEN_VILLAIN_BY_HERO.UTG1[0],
};

const hasNoOverlap = (a: string[], b: string[]) => !a.some((hand) => b.includes(hand));

const makeRfiSituationRecord = (
  heroPos: RfiPosition,
  raiseHands: HandClass[],
  limpHands: HandClass[],
  stack: EffectiveStackBb,
): RfiSituationPolicyRecord => ({
  situation: { game: 'NLH', table: '9max', effectiveStackBb: stack, heroPos, facingAction: 'none' },
  drillType: 'rfi',
  actionSet:
    heroPos === 'SB'
      ? [
          { id: 'RAISE', label: 'RAISE', color: 'raise' },
          { id: 'LIMP', label: 'LIMP', color: 'limp' },
          { id: 'FOLD', label: 'FOLD', color: 'fold' },
        ]
      : [
          { id: 'RAISE', label: 'RAISE', color: 'raise' },
          { id: 'FOLD', label: 'FOLD', color: 'fold' },
        ],
  policy: heroPos === 'SB' ? { raise: raiseHands, limp: limpHands } : { raise: raiseHands },
});

const makeFacingOpenSituationRecord = (
  heroPos: FacingOpenHeroPosition,
  villainPos: Position,
  callHands: HandClass[],
  threeBetHands: HandClass[],
  stack: EffectiveStackBb,
): FacingOpenSituationPolicyRecord => ({
  situation: {
    game: 'NLH',
    table: '9max',
    effectiveStackBb: stack,
    heroPos,
    facingAction: 'open',
    villainPos,
  },
  drillType: 'facing_open',
  actionSet: [
    { id: 'FOLD', label: 'FOLD', color: 'fold' },
    { id: 'CALL', label: 'CALL', color: 'call' },
    { id: '3BET', label: '3BET', color: 'threebet' },
  ],
  policy: { call: callHands, threeBet: threeBetHands },
});

const makeThreeBetSituationRecord = (
  heroPos: ThreeBetHeroPosition,
  villainPos: Position,
  callHands: HandClass[],
  fourBetHands: HandClass[],
  stack: EffectiveStackBb,
): ThreeBetSituationPolicyRecord => ({
  situation: {
    game: 'NLH',
    table: '9max',
    effectiveStackBb: stack,
    heroPos,
    facingAction: 'three_bet',
    villainPos,
  },
  drillType: 'three_bet',
  actionSet: [
    { id: 'FOLD', label: 'FOLD', color: 'fold' },
    { id: 'CALL', label: 'CALL', color: 'call' },
    { id: '4BET', label: '4BET', color: 'threebet' },
  ],
  policy: { call: callHands, fourBet: fourBetHands },
});

const applyFacingOpenPreset = (
  situations: AppData['situations'],
  presetId: PresetId,
  format: DrillFormat = DEFAULT_FORMAT,
  stack: EffectiveStackBb = DEFAULT_STACK_BB,
) => {
  const bundle = getStackDataBundle(format, stack);
  if (!bundle) return;
  const facingOpenSource = PRESETS[presetId]?.facingOpen ?? bundle.facingOpen;
  Object.entries(facingOpenSource).forEach(([matchupKey, range]) => {
    const match = matchupKey.match(/^FO_(.+)_VS_(.+)$/);
    if (!match) return;
    const hero = match[1] as FacingOpenHeroPosition;
    const villain = match[2] as Position;
    const call = parseRangeShorthand(range.call);
    const threeBet = parseRangeShorthand(range.threeBet);
    if (!call.ok || !threeBet.ok || !hasNoOverlap(call.hands, threeBet.hands)) return;
    situations[makeFacingOpenKey(hero, villain, format, stack)] = makeFacingOpenSituationRecord(
      hero,
      villain,
      call.hands,
      threeBet.hands,
      stack,
    );
  });
};

const applyThreeBetDefaults = (
  situations: AppData['situations'],
  format: DrillFormat = DEFAULT_FORMAT,
  stack: EffectiveStackBb = DEFAULT_STACK_BB,
) => {
  const bundle = getStackDataBundle(format, stack);
  if (!bundle) return;
  Object.entries(bundle.threeBet).forEach(([matchupKey, range]) => {
    const [hero, villain] = matchupKey.split('_VS_');
    const call = parseRangeShorthand(range.call);
    const fourBet = parseRangeShorthand(range.fourBet);
    if (!call.ok || !fourBet.ok || !hasNoOverlap(call.hands, fourBet.hands)) return;
    situations[makeThreeBetKey(hero as ThreeBetHeroPosition, villain as Position, format, stack)] =
      makeThreeBetSituationRecord(
        hero as ThreeBetHeroPosition,
        villain as Position,
        call.hands,
        fourBet.hands,
        stack,
      );
  });
};

export const createDefaultData = (
  format: DrillFormat = DEFAULT_FORMAT,
  stack: EffectiveStackBb = DEFAULT_STACK_BB,
): AppData => {
  const situations: AppData['situations'] = {};
  const bundle = getStackDataBundle(format, stack);
  const rfiDefaults = bundle?.rfi ?? PRESETS[defaultPresetId].rfi;
  RFI_POSITIONS.forEach((position) => {
    const raiseParsed = parseRangeShorthand(rfiDefaults.raise[position]);
    const limpParsed =
      position === 'SB' ? parseRangeShorthand(rfiDefaults.limp.SB) : { ok: true, hands: [] };
    situations[makeRfiKey(position, format, stack)] = makeRfiSituationRecord(
      position,
      raiseParsed.ok ? raiseParsed.hands : [],
      limpParsed.ok ? limpParsed.hands : [],
      stack,
    );
  });
  applyFacingOpenPreset(situations, defaultPresetId, format, stack);
  applyThreeBetDefaults(situations, format, stack);

  return {
    version: STORAGE_VERSION,
    meta: { game: 'NLH', table: '9max', effectiveStackBb: stack },
    rangesetName: '9-max 100bb preflop',
    situations,
    stats: {
      total: { attempts: 0, correct: 0 },
      byRfiPosition: createEmptyRfiStats(),
      byFacingHero: createEmptyFacingStats(),
      byFacingMatchup: {},
      byHand: {},
      mistakes: {},
      promptMemory: {},
    },
    settings: {
      revealOnIncorrectOnly: true,
      adaptiveRepetition: false,
      handDisplayMode: 'class',
      randomHandMode: 'uniform169',
      difficulty: 'normal',
      themeMode: 'system',
      defaultPresetId,
      drillType: 'rfi',
      positionFocus: {
        rfi: [...RFI_POSITIONS],
        facing_open: [...FACING_OPEN_HERO_POSITIONS],
        three_bet: [...THREE_BET_HERO_POSITIONS],
      },
      facingOpenSelection: defaultFacingOpenSelection,
      drillContext: { ...DEFAULT_DRILL_CONTEXT, format, effectiveStackBb: stack },
    },
  };
};

export const createDefaultSession = (): SessionStats => ({
  version: 2,
  attempts: 0,
  correct: 0,
  byRfiPosition: createEmptyRfiStats(),
  byFacingHero: createEmptyFacingStats(),
  totalResponseMs: 0,
});
