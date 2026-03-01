export const FORMAT_IDS = ['cash9max'] as const;
export type DrillFormat = (typeof FORMAT_IDS)[number];

export const STACK_SIZES_BB = [30, 60, 100, 150] as const;
export type EffectiveStackBb = (typeof STACK_SIZES_BB)[number];

export const DEFAULT_FORMAT: DrillFormat = 'cash9max';
export const DEFAULT_STACK_BB: EffectiveStackBb = 100;
