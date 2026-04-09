import type { AnalysisSummary, SideMetrics } from './types';

const edgeLabel = (delta: number, closeThreshold: number): 'Hero' | 'Villain' | 'Close' => {
  if (Math.abs(delta) <= closeThreshold) return 'Close';
  return delta > 0 ? 'Hero' : 'Villain';
};

const densityProxy = (metrics: SideMetrics): number =>
  metrics.onePairPlusShare * 0.25 + metrics.twoPairPlusShare * 0.35 + metrics.tripsPlusShare * 0.2 + metrics.straightPlusShare * 0.2;

const topEndProxy = (metrics: SideMetrics): number =>
  metrics.twoPairPlusShare * 0.35 + metrics.tripsPlusShare * 0.35 + metrics.straightPlusShare * 0.2 + metrics.flushShare * 0.1;

export const buildAnalysisSummary = (hero: SideMetrics, villain: SideMetrics): AnalysisSummary => {
  const equityDelta = (hero.rawEquity ?? densityProxy(hero)) - (villain.rawEquity ?? densityProxy(villain));
  const topEndDelta = topEndProxy(hero) - topEndProxy(villain);

  const rawEquityEdge = edgeLabel(equityDelta, 0.03);
  const topEndEdge = edgeLabel(topEndDelta, 0.035);

  const notes: string[] = [];
  if (rawEquityEdge === 'Close') notes.push('Overall range interaction looks close on this flop.');
  else notes.push(`${rawEquityEdge} appears to have a small overall range advantage.`);

  if (topEndEdge === 'Close') notes.push('Top-end coverage appears relatively balanced.');
  else notes.push(`${topEndEdge} appears to hold more top-end made hand coverage.`);

  if (hero.rawEquity == null || villain.rawEquity == null) {
    notes.push('Raw equity is not computed in this MVP view; edge uses density proxies.');
  }

  return { rawEquityEdge, topEndEdge, notes };
};
