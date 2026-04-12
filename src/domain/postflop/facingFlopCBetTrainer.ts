import acceptedBtnVsCo from '../../lib/data/postflop-facing-cbet/libraries/cash9max-100-btn-vs-co-srp-flop-ip-facing-cbet.accepted.json' with { type: 'json' };
import reviewBtnVsCo from '../../lib/data/postflop-facing-cbet/libraries/cash9max-100-btn-vs-co-srp-flop-ip-facing-cbet.review.json' with { type: 'json' };
import { shuffleQuizEntries } from './quizOrdering';

export type FacingFlopCBetSpotId = 'cash9max-100-btn-vs-co-srp-flop-ip-facing-cbet';
export type FacingFlopCBetSizeBucket = 'small' | 'big';
export type FacingFlopCBetResponse = 'fold' | 'call' | 'raise';

export type FacingFlopCBetPrompt = {
  id: string;
  drillFamily: 'postflop-facing-flop-cbet';
  drillType: 'facing-flop-cbet-hand-level';
  spot: FacingFlopCBetSpotId;
  spotLabel: string;
  board: [string, string, string];
  heroHand: [string, string];
  cBetSizeBucket: FacingFlopCBetSizeBucket;
  potSizeBb: number;
  cBetSizeBb: number;
  recommendedResponse: FacingFlopCBetResponse;
  explanation: {
    summary: string;
    bullets: string[];
    tags: string[];
  };
  tags: string[];
};

export type FacingFlopCBetReviewPrompt = Omit<FacingFlopCBetPrompt, 'recommendedResponse' | 'explanation'> & {
  recommendedResponse: FacingFlopCBetResponse | null;
  explanation: FacingFlopCBetPrompt['explanation'] | null;
  accepted: boolean;
  rejectionReason: string | null;
};

export type FacingFlopCBetSpot = {
  id: FacingFlopCBetSpotId;
  label: string;
  description: string;
  enabled: boolean;
  openerPos: 'CO';
  callerPos: 'BTN';
};

const SPOT_CATALOG: FacingFlopCBetSpot[] = [
  {
    id: 'cash9max-100-btn-vs-co-srp-flop-ip-facing-cbet',
    label: 'BTN vs CO SRP (Facing Flop C-Bet)',
    description: 'Hero called preflop on BTN and now responds in position vs CO flop c-bet.',
    enabled: true,
    openerPos: 'CO',
    callerPos: 'BTN',
  },
];

const ACCEPTED_BY_SPOT: Record<FacingFlopCBetSpotId, FacingFlopCBetPrompt[]> = {
  'cash9max-100-btn-vs-co-srp-flop-ip-facing-cbet': acceptedBtnVsCo as FacingFlopCBetPrompt[],
};

const REVIEW_BY_SPOT: Record<FacingFlopCBetSpotId, FacingFlopCBetReviewPrompt[]> = {
  'cash9max-100-btn-vs-co-srp-flop-ip-facing-cbet': reviewBtnVsCo as FacingFlopCBetReviewPrompt[],
};

const validateFacingFlopCBetLibrary = (
  spotId: FacingFlopCBetSpotId,
  accepted: FacingFlopCBetPrompt[],
  review: FacingFlopCBetReviewPrompt[],
) => {
  const acceptedIds = new Set<string>();
  for (const prompt of accepted) {
    if (prompt.spot !== spotId) throw new Error(`Accepted prompt spot mismatch for ${prompt.id}`);
    if (acceptedIds.has(prompt.id)) throw new Error(`Duplicate accepted prompt id ${prompt.id}`);
    acceptedIds.add(prompt.id);
    const cards = new Set([...prompt.board, ...prompt.heroHand]);
    if (cards.size !== 5) throw new Error(`Accepted prompt has card collision ${prompt.id}`);
  }

  for (const prompt of review) {
    if (prompt.spot !== spotId) throw new Error(`Review prompt spot mismatch for ${prompt.id}`);
    if (prompt.accepted) {
      if (!acceptedIds.has(prompt.id)) throw new Error(`Review accepted prompt missing in accepted library: ${prompt.id}`);
      if (!prompt.recommendedResponse || !prompt.explanation) {
        throw new Error(`Review accepted prompt missing response/explanation: ${prompt.id}`);
      }
    } else if (!prompt.rejectionReason) {
      throw new Error(`Rejected review prompt missing rejection reason: ${prompt.id}`);
    }
  }
};

Object.keys(ACCEPTED_BY_SPOT).forEach((spotId) => {
  validateFacingFlopCBetLibrary(
    spotId as FacingFlopCBetSpotId,
    ACCEPTED_BY_SPOT[spotId as FacingFlopCBetSpotId],
    REVIEW_BY_SPOT[spotId as FacingFlopCBetSpotId],
  );
});

export const FACING_FLOP_CBET_MVP_SPOT_ID: FacingFlopCBetSpotId = 'cash9max-100-btn-vs-co-srp-flop-ip-facing-cbet';

export const getFacingFlopCBetSpotCatalog = (): FacingFlopCBetSpot[] => [...SPOT_CATALOG];
export const getEnabledFacingFlopCBetSpots = (): FacingFlopCBetSpot[] => SPOT_CATALOG.filter((spot) => spot.enabled);

export const getFacingFlopCBetAcceptedPromptsForSpot = (spotId: FacingFlopCBetSpotId): FacingFlopCBetPrompt[] => {
  const prompts = ACCEPTED_BY_SPOT[spotId];
  if (!prompts) throw new Error(`Facing flop c-bet accepted library is not registered for spot ${spotId}`);
  return [...prompts];
};

export const getFacingFlopCBetReviewPromptsForSpot = (spotId: FacingFlopCBetSpotId): FacingFlopCBetReviewPrompt[] => {
  const prompts = REVIEW_BY_SPOT[spotId];
  if (!prompts) throw new Error(`Facing flop c-bet review library is not registered for spot ${spotId}`);
  return [...prompts];
};

export const shuffleFacingFlopCBetPrompts = (
  prompts: FacingFlopCBetPrompt[],
  rng: () => number = Math.random,
): FacingFlopCBetPrompt[] => shuffleQuizEntries(prompts, rng);

export const evaluateFacingFlopCBetSelection = (
  prompt: FacingFlopCBetPrompt,
  response: FacingFlopCBetResponse,
): { correct: boolean } => ({ correct: response === prompt.recommendedResponse });

export const nextFacingFlopCBetPromptIndex = (currentIndex: number, total: number): number => {
  if (total <= 0) return 0;
  return (currentIndex + 1) % total;
};
