import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildAnalyzerSpots, getAnalyzerStacks, parseAnalyzerSpotId } from '../../domain/postflop-analysis/catalog';
import { analyzeHandVsRange } from '../../domain/postflop-analysis/analyzeHandVsRange';
import { compareRangesOnFlop } from '../../domain/postflop-analysis/compareRanges';
import { validateExactHandSelection, validateFlopSelection } from '../../domain/postflop-analysis/flopSelection';
import { generateFlopFromPreset } from '../../domain/postflop-analysis/simplifiedBoards';
import { buildAnalysisSummary } from '../../domain/postflop-analysis/summaries';
import { FlopSelector } from './FlopSelector';
import { HandSelector } from './HandSelector';
import { MetricsPanel } from './MetricsPanel';
import { SpotSelector } from './SpotSelector';
import { SummaryPanel } from './SummaryPanel';
import { CardRow } from '../../components/PlayingCard';
import type { AppData, FacingOpenHeroPosition, RfiPosition } from '../../lib/types';

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

  const openerOptions = useMemo(
    () => [...new Set(spots.map((spot) => spot.openerPos))],
    [spots],
  );

  const parsedSpot = useMemo(() => parseAnalyzerSpotId(analyzer.spotId), [analyzer.spotId]);
  const desiredOpener = analyzer.openerPos ?? parsedSpot?.openerPos ?? openerOptions[0] ?? null;
  const selectedOpener = desiredOpener && openerOptions.includes(desiredOpener) ? desiredOpener : openerOptions[0] ?? null;

  const callerOptions = useMemo(
    () => spots.filter((spot) => spot.openerPos === selectedOpener).map((spot) => spot.callerPos),
    [selectedOpener, spots],
  );

  const desiredCaller = analyzer.callerPos ?? parsedSpot?.callerPos ?? callerOptions[0] ?? null;
  const selectedCaller = desiredCaller && callerOptions.includes(desiredCaller) ? desiredCaller : callerOptions[0] ?? null;

  const selectedSpot = useMemo(() => {
    if (!selectedOpener || !selectedCaller) return null;
    return spots.find((spot) => spot.openerPos === selectedOpener && spot.callerPos === selectedCaller) ?? null;
  }, [selectedCaller, selectedOpener, spots]);

  const flopSelection = analyzer.flop ?? ['', '', ''];
  const exactFlopResult = validateFlopSelection(flopSelection);
  const simplifiedFlop = useMemo(() => {
    if (!analyzer.simplifiedPresetId) return null;
    try {
      return generateFlopFromPreset(analyzer.simplifiedPresetId);
    } catch {
      return null;
    }
  }, [analyzer.simplifiedPresetId]);
  const activeFlopResult = useMemo(() => (
    analyzer.boardInputMode === 'exact'
      ? exactFlopResult
      : (simplifiedFlop ? { ok: true as const, flop: simplifiedFlop } : { ok: false as const, error: 'Select a simplified board preset.' })
  ), [analyzer.boardInputMode, exactFlopResult, simplifiedFlop]);

  const handSelection = analyzer.exactHand ?? ['', ''];
  const handResult = activeFlopResult.ok ? validateExactHandSelection(handSelection, activeFlopResult.flop) : validateExactHandSelection(handSelection);

  const [runToken, setRunToken] = useState(0);
  const lastHandledRunTokenRef = useRef(0);
  const [isRunning, setIsRunning] = useState(false);
  const [rangeVsRangeAnalysis, setRangeVsRangeAnalysis] = useState<ReturnType<typeof compareRangesOnFlop> | null>(null);
  const [handVsRangeAnalysis, setHandVsRangeAnalysis] = useState<ReturnType<typeof analyzeHandVsRange> | null>(null);

  const canRun = Boolean(
    selectedSpot
    && activeFlopResult.ok
    && (analyzer.mode === 'range-vs-range' || (analyzer.mode === 'hand-vs-range' && handResult.ok)),
  );
  const activeFlopKey = activeFlopResult.ok ? activeFlopResult.flop.map((card) => `${card.rank}${card.suit}`).join('-') : 'invalid-flop';
  const handKey = handResult.ok ? handResult.hand.join('-') : 'invalid-hand';

  useEffect(() => {
    setRangeVsRangeAnalysis(null);
    setHandVsRangeAnalysis(null);
    setIsRunning(false);
  }, [analyzer.mode, selectedSpot?.id, activeFlopKey, handKey]);

  useEffect(() => {
    if (!runToken || !selectedSpot || !activeFlopResult.ok) return;
    if (analyzer.mode === 'hand-vs-range' && !handResult.ok) return;
    if (runToken === lastHandledRunTokenRef.current) return;
    lastHandledRunTokenRef.current = runToken;

    let cancelled = false;
    setIsRunning(true);
    const timeout = window.setTimeout(() => {
      if (cancelled) return;
      if (analyzer.mode === 'range-vs-range') {
        setRangeVsRangeAnalysis(compareRangesOnFlop(selectedSpot.heroRange, selectedSpot.villainRange, activeFlopResult.flop));
        setHandVsRangeAnalysis(null);
      } else if (handResult.ok) {
        setHandVsRangeAnalysis(analyzeHandVsRange(handResult.hand, selectedSpot.villainRange, activeFlopResult.flop));
        setRangeVsRangeAnalysis(null);
      }
      setIsRunning(false);
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [activeFlopResult, analyzer.mode, handResult, runToken, selectedSpot]);

  const summary = useMemo(
    () => (rangeVsRangeAnalysis ? buildAnalysisSummary(rangeVsRangeAnalysis.hero, rangeVsRangeAnalysis.villain) : null),
    [rangeVsRangeAnalysis],
  );

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
    const openerChanged = analyzer.openerPos !== (selectedOpener ?? null);
    const callerChanged = analyzer.callerPos !== (selectedCaller ?? null);
    if (!stackChanged && !spotChanged && !openerChanged && !callerChanged) return;

    updateAnalyzer((prev: AppData['settings']['analyzer']) => ({
      ...prev,
      effectiveStackBb: selectedStack,
      spotId: nextSpotId,
      openerPos: selectedOpener,
      callerPos: selectedCaller,
    }));
  }, [
    analyzer.callerPos,
    analyzer.effectiveStackBb,
    analyzer.openerPos,
    analyzer.spotId,
    selectedCaller,
    selectedOpener,
    selectedSpot?.id,
    selectedStack,
    stacks.length,
    updateAnalyzer,
  ]);

  return (
    <section>
      <h2>Analyzer</h2>
      <p className="muted">Compare SRP ranges or an exact hand vs a stored range on the flop.</p>

      <label>Analyzer mode</label>
      <select
        value={analyzer.mode}
        onChange={(event) => updateAnalyzer((prev: AppData['settings']['analyzer']) => ({
          ...prev,
          mode: event.target.value as typeof prev.mode,
        }))}
      >
        <option value="range-vs-range">Range vs Range</option>
        <option value="hand-vs-range">Hand vs Range</option>
      </select>

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
            openerPos: null,
            callerPos: null,
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
        openerOptions={openerOptions}
        callerOptions={callerOptions}
        openerValue={selectedOpener}
        callerValue={selectedCaller}
        disabled={!spots.length}
        onOpenerChange={(openerPos: RfiPosition) => updateAnalyzer((prev: AppData['settings']['analyzer']) => ({
          ...prev,
          openerPos,
          callerPos: null,
          spotId: null,
        }))}
        onCallerChange={(callerPos: FacingOpenHeroPosition) => updateAnalyzer((prev: AppData['settings']['analyzer']) => ({
          ...prev,
          callerPos,
          spotId: null,
        }))}
      />

      {selectedSpot && <p className="muted">Matchup: {selectedSpot.label}</p>}

      {analyzer.mode === 'hand-vs-range' && (
        <HandSelector
          selected={handSelection}
          error={handResult.ok || !activeFlopResult.ok ? null : handResult.error}
          onChange={(index, value) => {
            const next = [...handSelection] as [string, string];
            next[index] = value;
            updateAnalyzer((prev: AppData['settings']['analyzer']) => ({ ...prev, exactHand: next }));
          }}
        />
      )}

      <FlopSelector
        boardInputMode={analyzer.boardInputMode}
        selected={flopSelection}
        selectedPresetId={analyzer.simplifiedPresetId}
        generatedFlop={simplifiedFlop}
        onBoardInputModeChange={(boardInputMode) => updateAnalyzer((prev: AppData['settings']['analyzer']) => ({ ...prev, boardInputMode }))}
        onPresetChange={(presetId) => updateAnalyzer((prev: AppData['settings']['analyzer']) => ({ ...prev, simplifiedPresetId: presetId || null }))}
        onChange={(index, value) => {
          const next = [...flopSelection] as [string, string, string];
          next[index] = value;
          updateAnalyzer((prev: AppData['settings']['analyzer']) => ({ ...prev, flop: next }));
        }}
        error={activeFlopResult.ok ? null : activeFlopResult.error}
      />

      <button type="button" onClick={() => setRunToken((value) => value + 1)} disabled={!canRun || isRunning}>
        Calc equity
      </button>
      {isRunning && <p className="muted">Running...</p>}

      {!stacks.length && <p className="muted">No supported SRP analyzer spots available for current data.</p>}
      {stacks.length > 0 && !spots.length && <p className="muted">No SRP spots for this stack yet.</p>}

      {rangeVsRangeAnalysis && summary && (
        <>
          <MetricsPanel analysis={rangeVsRangeAnalysis} />
          <SummaryPanel summary={summary} />
        </>
      )}

      {handVsRangeAnalysis && (
        <div className="card">
          <h3>Hand vs Range</h3>
          <p>
            Exact hand: <CardRow cards={handVsRangeAnalysis.hand.hole} label="Analyzed hand" />
          </p>
          <p>Board: <CardRow cards={handVsRangeAnalysis.flop} label="Analyzed board" /></p>
          <p>Hand category: <strong>{handVsRangeAnalysis.hand.category}</strong></p>
          <p>Hand draws: <strong>{handVsRangeAnalysis.hand.drawCategory}</strong></p>
          <p>Hand raw equity: <strong>{handVsRangeAnalysis.hand.rawEquity == null ? 'N/A' : `${(handVsRangeAnalysis.hand.rawEquity * 100).toFixed(1)}%`}</strong></p>
          <hr />
          <p>Range combos after blockers: <strong>{handVsRangeAnalysis.range.comboCount}</strong></p>
          <p>Range one pair+: <strong>{(handVsRangeAnalysis.range.onePairPlusShare * 100).toFixed(1)}%</strong></p>
          <p>Range two pair+: <strong>{(handVsRangeAnalysis.range.twoPairPlusShare * 100).toFixed(1)}%</strong></p>
          <p>Range trips+: <strong>{(handVsRangeAnalysis.range.tripsPlusShare * 100).toFixed(1)}%</strong></p>
          <p>Range straight+: <strong>{(handVsRangeAnalysis.range.straightPlusShare * 100).toFixed(1)}%</strong></p>
          <p>Range flush: <strong>{(handVsRangeAnalysis.range.flushShare * 100).toFixed(1)}%</strong></p>
          <p>Range flush draw: <strong>{(handVsRangeAnalysis.range.flushDrawShare * 100).toFixed(1)}%</strong></p>
          <p>Range open-ended: <strong>{(handVsRangeAnalysis.range.openEndedShare * 100).toFixed(1)}%</strong></p>
          <p>Range gutshot: <strong>{(handVsRangeAnalysis.range.gutshotShare * 100).toFixed(1)}%</strong></p>
          <ul>
            {handVsRangeAnalysis.notes.map((note) => <li key={note}>{note}</li>)}
          </ul>
          <p className="muted">This is a range-interaction study view, not solver advice.</p>
        </div>
      )}
    </section>
  );
}
