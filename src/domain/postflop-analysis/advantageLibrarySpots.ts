import type { AdvantageSpotConfig } from './advantageLibrary';
import { ADVANTAGE_BOARD_CANDIDATE_SOURCES } from './advantageLibraryCandidates';

export const ADVANTAGE_SPOT_CONFIGS: AdvantageSpotConfig[] = [
  {
    id: 'cash9max-100-btn-vs-bb-srp-flop',
    descriptor: {
      format: 'cash9max',
      effectiveStackBb: 100,
      openerPos: 'BTN',
      callerPos: 'BB',
      street: 'flop',
    },
    candidateSource: ADVANTAGE_BOARD_CANDIDATE_SOURCES.coreFlopsV1,
  },
  {
    id: 'cash9max-100-co-vs-bb-srp-flop',
    descriptor: {
      format: 'cash9max',
      effectiveStackBb: 100,
      openerPos: 'CO',
      callerPos: 'BB',
      street: 'flop',
    },
    candidateSource: ADVANTAGE_BOARD_CANDIDATE_SOURCES.coreFlopsPlusV1,
    options: {
      minAccepted: 25,
      maxAccepted: 52,
    },
  },
];

export const ADVANTAGE_SPOT_CONFIG_BY_ID: Record<string, AdvantageSpotConfig> = Object.fromEntries(
  ADVANTAGE_SPOT_CONFIGS.map((config) => [config.id, config]),
);

export const getAdvantageSpotConfigById = (id: string): AdvantageSpotConfig => {
  const config = ADVANTAGE_SPOT_CONFIG_BY_ID[id];
  if (!config) throw new Error(`Unknown advantage library spot id: ${id}`);
  return config;
};
