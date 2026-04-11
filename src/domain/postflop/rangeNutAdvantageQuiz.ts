import librariesIndex from '../../lib/data/postflop-analysis/libraries/index.json' with { type: 'json' };
import btnVsBbAccepted from '../../lib/data/postflop-analysis/libraries/cash9max-100-btn-vs-bb-srp-flop.accepted.json' with { type: 'json' };

export type AdvantageAnswer = 'hero' | 'villain' | 'close';

export type RangeNutSpotId = (typeof librariesIndex)[number]['id'];

export type RangeNutQuizEntry = {
  id: string;
  spot: RangeNutSpotId;
  board: [string, string, string];
  familyTags: string[];
  rangeAdvantage: AdvantageAnswer;
  nutAdvantage: AdvantageAnswer;
  explanation: {
    summary: string;
    tags: string[];
  };
};

export type RangeNutQuizSpot = {
  id: RangeNutSpotId;
  label: string;
  description: string;
  enabled: boolean;
};

const SPOT_CATALOG: RangeNutQuizSpot[] = [
  {
    id: 'cash9max-100-btn-vs-bb-srp-flop',
    label: 'BTN vs BB SRP (Flop)',
    description: 'Single-raised pot, in-position opener vs big blind caller.',
    enabled: true,
  },
  {
    id: 'cash9max-100-co-vs-bb-srp-flop',
    label: 'CO vs BB SRP (Flop)',
    description: 'Reserved for future expansion.',
    enabled: false,
  },
];

const LIBRARIES_BY_SPOT: Partial<Record<RangeNutSpotId, RangeNutQuizEntry[]>> = {
  'cash9max-100-btn-vs-bb-srp-flop': btnVsBbAccepted as RangeNutQuizEntry[],
};

export const RANGE_NUT_MVP_SPOT_ID: RangeNutSpotId = 'cash9max-100-btn-vs-bb-srp-flop';

export const getRangeNutQuizSpotCatalog = (): RangeNutQuizSpot[] => [...SPOT_CATALOG];

export const getEnabledRangeNutQuizSpots = (): RangeNutQuizSpot[] => SPOT_CATALOG.filter((spot) => spot.enabled);

export const getRangeNutQuizEntriesForSpot = (spotId: RangeNutSpotId): RangeNutQuizEntry[] => {
  const entries = LIBRARIES_BY_SPOT[spotId];
  if (!entries) {
    throw new Error(`Range/Nut quiz library is not registered for spot ${spotId}`);
  }
  return [...entries];
};

export type RangeNutQuizSelection = {
  rangeAdvantage: AdvantageAnswer;
  nutAdvantage: AdvantageAnswer;
};

export type RangeNutQuizEvaluation = {
  rangeCorrect: boolean;
  nutCorrect: boolean;
  fullyCorrect: boolean;
};

export const evaluateRangeNutQuizSelection = (
  entry: RangeNutQuizEntry,
  selection: RangeNutQuizSelection,
): RangeNutQuizEvaluation => {
  const rangeCorrect = selection.rangeAdvantage === entry.rangeAdvantage;
  const nutCorrect = selection.nutAdvantage === entry.nutAdvantage;
  return {
    rangeCorrect,
    nutCorrect,
    fullyCorrect: rangeCorrect && nutCorrect,
  };
};

export const nextPromptIndex = (currentIndex: number, total: number): number => {
  if (total <= 0) return 0;
  return (currentIndex + 1) % total;
};
