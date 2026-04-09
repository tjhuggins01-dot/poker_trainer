import { useCallback, useEffect, useMemo } from 'react';
import { buildAnalyzerSpots, getAnalyzerStacks } from '../../domain/postflop-analysis/catalog';
import { compareRangesOnFlop } from '../../domain/postflop-analysis/compareRanges';
import { validateFlopSelection } from '../../domain/postflop-analysis/flopSelection';
import { buildAnalysisSummary } from '../../domain/postflop-analysis/summaries';
import { FlopSelector } from './FlopSelector';
import { MetricsPanel } from './MetricsPanel';
import { SpotSelector } from './SpotSelector';
import { SummaryPanel } from './SummaryPanel';
import type { AppData } from '../../lib/types';

type Props = {
  data: AppData;
  onDataChange: (updater: (prev: AppData) => AppData) => void;
};

export function AnalyzerPage({ data, onDataChange }: Props) {
  const analyzer = data.settings.analyzer;
  const stacks = useMemo(
    () => getAnalyzerStacks(data, analyzer.format),
    [data, analyzer.format],
  );
  const selectedStack = stacks.includes(analyzer.effectiveStackBb) ? analyzer.effectiveStackBb : stacks[0];

  const spots = useMemo(
    () => (selectedStack ? buildAnalyzerSpots(data, analyzer.format, selectedStack) : []),
    [data, analyzer.format, selectedStack],
  );

  const selectedSpot = spots.find((spot) => spot.id === analyzer.spotId) ?? spots[0];
  const flopSelection = analyzer.flop ?? ['', '', ''];
  const flopResult = validateFlopSelection(flopSelection);

  const analysis = selectedSpot && flopResult.ok
    ? compareRangesOnFlop(selectedSpot.heroRange, selectedSpot.villainRange, flopResult.flop)
    : null;

  const summary = analysis ? buildAnalysisSummary(analysis.hero, analysis.villain) : null;

  const updateAnalyzer = useCallback(
    (updater: (prev: AppData['settings']['analyzer']) => AppData['settings']['analyzer']) => {
      onDataChange((prev: AppData) => ({
        ...prev,
        settings: {
          ...prev.settings,
          analyzer: updater(prev.settings.analyzer),
        },
      }));
    },
    [onDataChange],
  );

  useEffect(() => {
    if (!stacks.length || !selectedStack) return;

    const nextSpotId = selectedSpot?.id ?? null;
    const stackChanged = analyzer.effectiveStackBb !== selectedStack;
    const spotChanged = analyzer.spotId !== nextSpotId;
    if (!stackChanged && !spotChanged) return;

    updateAnalyzer((prev: AppData['settings']['analyzer']) => ({
      ...prev,
      effectiveStackBb: selectedStack,
      spotId: nextSpotId,
    }));
  }, [analyzer.effectiveStackBb, analyzer.spotId, selectedSpot?.id, selectedStack, stacks.length, updateAnalyzer]);

  return (
    <section>
      <h2>Analyzer</h2>
      <p className="muted">Compare stored SRP opener-vs-BB-call ranges on an exact flop.</p>

      <label>Stack</label>
      <select
        value={selectedStack ?? ''}
        disabled={!stacks.length}
        onChange={(event) => {
          const nextStack = Number(event.target.value);
          updateAnalyzer((prev: AppData['settings']['analyzer']) => ({
            ...prev,
            effectiveStackBb: nextStack as typeof prev.effectiveStackBb,
            spotId: null,
          }));
        }}
      >
        {!stacks.length && <option value="">No stacks available</option>}
        {stacks.map((stack) => (
          <option key={stack} value={stack}>
            {stack}bb
          </option>
        ))}
      </select>

      <SpotSelector
        spots={spots}
        value={selectedSpot?.id ?? null}
        disabled={!spots.length}
        onChange={(spotId) => updateAnalyzer((prev: AppData['settings']['analyzer']) => ({ ...prev, spotId }))}
      />

      <FlopSelector
        selected={flopSelection}
        onChange={(index, value) => {
          const next = [...flopSelection] as [string, string, string];
          next[index] = value;
          updateAnalyzer((prev: AppData['settings']['analyzer']) => ({ ...prev, flop: next }));
        }}
        error={flopResult.ok ? null : flopResult.error}
      />

      {!stacks.length && <p className="muted">No supported SRP analyzer spots available for current data.</p>}
      {stacks.length > 0 && !spots.length && <p className="muted">No SRP spots for this stack yet.</p>}

      {analysis && summary && (
        <>
          <MetricsPanel analysis={analysis} />
          <SummaryPanel summary={summary} />
        </>
      )}
    </section>
  );
}
