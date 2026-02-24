import { useMemo, useState } from 'react';
import { FeedbackPanel } from '../../components/FeedbackPanel';
import { buildWeightedHandMap } from '../../lib/logic';
import type { GridActionColor } from '../../components/HandGrid';
import { actionSetToColorMap, policyToActionMap } from '../../domain/policy/mappers';
import { policyKeyFromSituation } from '../../domain/policy/resolver';
import {
  FACING_OPEN_HERO_POSITIONS,
  RFI_POSITIONS,
  THREE_BET_HERO_POSITIONS,
  type AppData,
  type SessionStats,
} from '../../lib/types';
import { DrillActionButtons } from './components/DrillActionButtons';
import { DrillTypeSelector } from './components/DrillTypeSelector';
import { PositionFocusSelector } from './components/PositionFocusSelector';
import { SessionSummary } from './components/SessionSummary';
import { useDrillQuerySync } from './hooks/useDrillQuerySync';
import { usePromptCycle } from './hooks/usePromptCycle';

type Props = {
  data: AppData;
  session: SessionStats;
  onDataChange: (updater: (prev: AppData) => AppData) => void;
  onSessionChange: (updater: (prev: SessionStats) => SessionStats) => void;
  onResetSession: () => void;
};

export function DrillPage({ data, session, onDataChange, onSessionChange, onResetSession }: Props) {
  const situationsPolicyKey = useMemo(
    () =>
      Object.entries(data.situations)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, situation]) => `${key}:${situation.drillType}:${JSON.stringify(situation.policy)}`)
        .join('|'),
    [data.situations],
  );
  const weightedMap = useMemo(
    () => buildWeightedHandMap(data),
    [situationsPolicyKey, data.settings.difficulty],
  );
  const selectedFocusKey = useMemo(() => {
    const focus = data.settings.positionFocus[data.settings.drillType] as string[];
    return [...focus].sort().join('|');
  }, [data.settings.drillType, data.settings.positionFocus]);
  const drillResetKey = `${data.settings.drillType}:${selectedFocusKey}:${data.settings.difficulty}:${data.settings.drillContext.format}:${data.settings.drillContext.effectiveStackBb}:${situationsPolicyKey}`;

  const { updateDrillType } = useDrillQuerySync(data, onDataChange);

  const stackPrefix = `${data.settings.drillContext.format}_${data.settings.drillContext.effectiveStackBb}BB_`;
  const hasRfiData = Object.keys(data.situations).some((k) => k.startsWith(`RFI_${stackPrefix}`));
  const hasFacingOpenData = Object.keys(data.situations).some((k) =>
    k.startsWith(`FACING_OPEN_${stackPrefix}`),
  );
  const hasThreeBetData = Object.keys(data.situations).some((k) =>
    k.startsWith(`THREE_BET_${stackPrefix}`),
  );

  const [shownNotice, setShownNotice] = useState(false);

  const { prompt, status, correctAction, stepNext, answer } = usePromptCycle({
    data,
    weightedMap,
    drillResetKey,
    onDataChange,
    onSessionChange,
  });

  const isFacingOpen = prompt.situation.facingAction === 'open';
  const isThreeBet = prompt.situation.facingAction === 'three_bet';
  const key = policyKeyFromSituation(
    prompt.situation,
    data.settings.drillContext.format,
    data.settings.drillContext.effectiveStackBb,
  );
  const policy = data.situations[key]?.policy;
  const policyBuckets = policy as
    | Partial<Record<'call' | 'threeBet' | 'fourBet' | 'raise' | 'limp', string[]>>
    | undefined;

  const actionColors = useMemo(
    () => actionSetToColorMap(data.situations[key]?.actionSet),
    [data.situations, key],
  );

  const actionMap = useMemo(() => policyToActionMap(policy), [policy]);

  const percentageText = useMemo(() => {
    if (isFacingOpen || isThreeBet) {
      const call = policyBuckets?.call?.length ?? 0;
      const three = (policyBuckets?.threeBet?.length ?? 0) + (policyBuckets?.fourBet?.length ?? 0);
      const label = isThreeBet ? '4bet' : '3bet';
      return `Call ${((call / 169) * 100).toFixed(1)}% • ${label} ${((three / 169) * 100).toFixed(1)}% • Fold ${(((169 - call - three) / 169) * 100).toFixed(1)}%`;
    }
    const raise = policyBuckets?.raise?.length ?? 0;
    const limp = prompt.situation.heroPos === 'SB' ? (policyBuckets?.limp?.length ?? 0) : 0;
    return `Raise ${((raise / 169) * 100).toFixed(1)}%${prompt.situation.heroPos === 'SB' ? ` • Limp ${((limp / 169) * 100).toFixed(1)}%` : ''} • Fold ${(((169 - raise - limp) / 169) * 100).toFixed(1)}%`;
  }, [isFacingOpen, isThreeBet, policyBuckets, prompt.situation.heroPos]);

  const focusOptions =
    data.settings.drillType === 'rfi'
      ? RFI_POSITIONS
      : data.settings.drillType === 'three_bet'
        ? THREE_BET_HERO_POSITIONS
        : FACING_OPEN_HERO_POSITIONS;
  const selectedFocus =
    data.settings.drillType === 'rfi'
      ? data.settings.positionFocus.rfi
      : data.settings.drillType === 'three_bet'
        ? data.settings.positionFocus.three_bet
        : data.settings.positionFocus.facing_open;

  return (
    <section>
      <h2>Drill</h2>
      {data.migrationNotice && !shownNotice && (
        <div className="card">
          <p>{data.migrationNotice}</p>
          <button onClick={() => setShownNotice(true)}>Dismiss</button>
        </div>
      )}

      <DrillTypeSelector
        drillType={data.settings.drillType}
        hasRfiData={hasRfiData}
        hasFacingOpenData={hasFacingOpenData}
        hasThreeBetData={hasThreeBetData}
        onChange={updateDrillType}
      />

      <PositionFocusSelector
        focusOptions={focusOptions}
        selectedFocus={selectedFocus}
        onDataChange={onDataChange}
      />

      <div className="card">
        <p>Hero: {prompt.situation.heroPos}</p>
        {(isFacingOpen || isThreeBet) && (
          <p>
            {isThreeBet ? 'Facing 3-bet from' : 'Facing open from'}: {prompt.situation.villainPos}
          </p>
        )}
        <p className="big-hand">{prompt.handClass}</p>
      </div>

      <DrillActionButtons
        hasPolicy={!!policy}
        isFacingOpen={isFacingOpen}
        isThreeBet={isThreeBet}
        heroPos={prompt.situation.heroPos}
        onAnswer={answer}
      />

      <SessionSummary session={session} status={status} onResetSession={onResetSession} />

      {status === 'incorrect' && (
        <FeedbackPanel
          correctAction={correctAction}
          actionMap={actionMap}
          actionColors={actionColors as Record<string, GridActionColor>}
          testedHand={prompt.handClass}
          percentages={percentageText}
          onNext={stepNext}
        />
      )}
    </section>
  );
}
