import btnVsBbAccepted from '../../lib/data/postflop-analysis/libraries/cash9max-100-btn-vs-bb-srp-flop.accepted.json' with { type: 'json' };
import { RANGE_NUT_MVP_SPOT_ID, type RangeNutQuizEntry, type RangeNutSpotId } from './rangeNutAdvantageQuiz';

export type CBetAction = 'check' | 'bet-small' | 'bet-big';

export type FlopCBetEntry = RangeNutQuizEntry & {
  acceptedForCBet: boolean;
  recommendedCBetAction: CBetAction | null;
  cBetExplanation: {
    summary: string;
    tags: string[];
  } | null;
  cBetTags?: string[];
  cBetRejectionReason?: string;
};

export type FlopCBetSpot = {
  id: RangeNutSpotId;
  label: string;
  description: string;
  enabled: boolean;
};

const SPOT_CATALOG: FlopCBetSpot[] = [
  {
    id: RANGE_NUT_MVP_SPOT_ID,
    label: 'BTN vs BB SRP (Flop)',
    description: 'Single-raised pot, opener in position, board-level c-bet baseline.',
    enabled: true,
  },
  {
    id: 'cash9max-100-co-vs-bb-srp-flop',
    label: 'CO vs BB SRP (Flop)',
    description: 'Reserved for future expansion.',
    enabled: false,
  },
];

const EXCLUDED_CBET_BOARD_IDS: Record<string, string> = {
  'cash9max-100-btn-vs-bb-srp-flop-flop-021': 'Mixed low-connected dynamics make a single simplified action too muddy for MVP teaching.',
  'cash9max-100-btn-vs-bb-srp-flop-flop-046': 'Close-vs-close dynamic board where forcing one baseline c-bet size is too fragile for MVP simplification.',
};

const toActionLabelTag = (action: CBetAction): string => {
  if (action === 'bet-small') return 'strategy:broad-small-cbet';
  if (action === 'bet-big') return 'strategy:polar-big-cbet';
  return 'strategy:check-back-baseline';
};

export const labelFlopCBetAction = (entry: RangeNutQuizEntry): CBetAction => {
  const tags = new Set(entry.familyTags);

  if (tags.has('a-high-dry') || tags.has('k-high-dry')) return 'bet-small';
  if (tags.has('paired-high') && entry.rangeAdvantage === 'hero') return 'bet-small';

  if (tags.has('broadway-connected') || tags.has('qj-high-dynamic') || tags.has('two-tone-dynamic') || tags.has('middling-connected')) {
    if (entry.nutAdvantage === 'villain' && (tags.has('middling-connected') || tags.has('low-connected'))) {
      return 'check';
    }
    return entry.rangeAdvantage === 'villain' ? 'check' : 'bet-big';
  }

  if (tags.has('monotone-low')) return 'check';

  if (tags.has('monotone-high')) {
    return entry.rangeAdvantage === 'hero' && entry.nutAdvantage !== 'villain' ? 'bet-big' : 'check';
  }

  if (tags.has('low-connected') || tags.has('low-disconnected') || tags.has('paired-low')) return 'check';

  return entry.rangeAdvantage === 'hero' ? 'bet-small' : 'check';
};

const buildAdvantageTag = (entry: RangeNutQuizEntry): string => {
  if (entry.rangeAdvantage === 'hero' && entry.nutAdvantage === 'hero') return 'advantage:hero-range-and-nut';
  if (entry.rangeAdvantage === 'villain' && entry.nutAdvantage === 'villain') return 'advantage:bb-range-and-nut';
  if (entry.rangeAdvantage === 'hero') return 'advantage:hero-range';
  if (entry.nutAdvantage === 'hero') return 'advantage:hero-nut';
  if (entry.rangeAdvantage === 'villain') return 'advantage:bb-range';
  if (entry.nutAdvantage === 'villain') return 'advantage:bb-nut';
  return 'advantage:close';
};

export const buildCBetExplanation = (entry: RangeNutQuizEntry, action: CBetAction): { summary: string; tags: string[] } => {
  const textureTag = entry.familyTags[0] ? `texture:${entry.familyTags[0]}` : 'texture:mixed';
  const advantageTag = buildAdvantageTag(entry);
  if (action === 'bet-small') {
    return {
      summary: 'BTN retains enough broad range coverage on this texture to simplify toward a high-frequency small c-bet.',
      tags: [textureTag, advantageTag, 'range:btn-broad-edge', toActionLabelTag(action)],
    };
  }

  if (action === 'bet-big') {
    return {
      summary: 'This board is dynamic enough that BTN’s clean baseline is a more polarized big-bet strategy instead of broad small betting.',
      tags: [textureTag, advantageTag, 'polarization:preferred', toActionLabelTag(action)],
    };
  }

  const bbPressureTag = entry.rangeAdvantage === 'villain' || entry.nutAdvantage === 'villain'
    ? 'bb:strong-interaction'
    : 'bb:defends-wide-enough';
  return {
    summary: 'BB interacts strongly enough here that checking back is the most stable simplified baseline for BTN.',
    tags: [textureTag, advantageTag, bbPressureTag, toActionLabelTag(action)],
  };
};

export const extendRangeNutEntryWithCBet = (entry: RangeNutQuizEntry): FlopCBetEntry => {
  const rejectionReason = EXCLUDED_CBET_BOARD_IDS[entry.id];
  if (rejectionReason) {
    return {
      ...entry,
      acceptedForCBet: false,
      recommendedCBetAction: null,
      cBetExplanation: null,
      cBetRejectionReason: rejectionReason,
    };
  }

  const recommendedCBetAction = labelFlopCBetAction(entry);
  return {
    ...entry,
    acceptedForCBet: true,
    recommendedCBetAction,
    cBetExplanation: buildCBetExplanation(entry, recommendedCBetAction),
    cBetTags: [buildAdvantageTag(entry), ...entry.familyTags.map((tag) => `family:${tag}`)],
  };
};

const LIBRARIES_BY_SPOT: Partial<Record<RangeNutSpotId, FlopCBetEntry[]>> = {
  'cash9max-100-btn-vs-bb-srp-flop': (btnVsBbAccepted as RangeNutQuizEntry[]).map(extendRangeNutEntryWithCBet),
};

export const FLOP_CBET_MVP_SPOT_ID: RangeNutSpotId = RANGE_NUT_MVP_SPOT_ID;

export const getFlopCBetSpotCatalog = (): FlopCBetSpot[] => [...SPOT_CATALOG];
export const getEnabledFlopCBetSpots = (): FlopCBetSpot[] => SPOT_CATALOG.filter((spot) => spot.enabled);

export const getFlopCBetEntriesForSpot = (spotId: RangeNutSpotId): FlopCBetEntry[] => {
  const entries = LIBRARIES_BY_SPOT[spotId];
  if (!entries) throw new Error(`Flop c-bet library is not registered for spot ${spotId}`);
  return [...entries];
};

export const getAcceptedFlopCBetEntriesForSpot = (spotId: RangeNutSpotId): FlopCBetEntry[] =>
  getFlopCBetEntriesForSpot(spotId).filter((entry) => entry.acceptedForCBet && entry.recommendedCBetAction && entry.cBetExplanation);

export type FlopCBetEvaluation = { correct: boolean };

export const evaluateFlopCBetSelection = (entry: FlopCBetEntry, selectedAction: CBetAction): FlopCBetEvaluation => ({
  correct: selectedAction === entry.recommendedCBetAction,
});

export const nextFlopCBetPromptIndex = (currentIndex: number, total: number): number => {
  if (total <= 0) return 0;
  return (currentIndex + 1) % total;
};
