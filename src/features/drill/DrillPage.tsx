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
import { HandCategoryPage } from '../postflop/hand-category/HandCategoryPage';
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

export function DrillPage(props: Props) {
  const { updateDrillType } = useDrillQuerySync(props.data, props.onDataChange);
  const stackPrefix = `${props.data.settings.drillContext.format}_${props.data.settings.drillContext.effectiveStackBb}BB_`;
  const hasRfiData = Object.keys(props.data.situations).some((k) => k.startsWith(`RFI_${stackPrefix}`));
  const hasFacingOpenData = Object.keys(props.data.situations).some((k) =>
    k.startsWith(`FACING_OPEN_${stackPrefix}`),
  );
  const hasThreeBetData = Object.keys(props.data.situations).some((k) =>
    k.startsWith(`THREE_BET_${stackPrefix}`),
  );
  const hasLimpBranchData = Object.keys(props.data.situations).some((k) =>
    k.startsWith(`LIMP_ISO_${stackPrefix}`) || k.startsWith(`VS_ISO_${stackPrefix}`),
  );

  if (props.data.settings.drillType === 'postflop_hand_category') {
    return (
      <section>
        <h2>Drill</h2>
        <DrillTypeSelector
          drillType={props.data.settings.drillType}
          hasRfiData={hasRfiData}
          hasFacingOpenData={hasFacingOpenData}
          hasThreeBetData={hasThreeBetData}
          hasLimpBranchData={hasLimpBranchData}
          onChange={updateDrillType}
        />
        <HandCategoryPage
          data={props.data}
          session={props.session}
          onDataChange={props.onDataChange}
          onSessionChange={props.onSessionChange}
        />
      </section>
    );
  }

  return <PreflopDrillPage {...props} updateDrillType={updateDrillType} hasRfiData={hasRfiData} hasFacingOpenData={hasFacingOpenData} hasThreeBetData={hasThreeBetData} hasLimpBranchData={hasLimpBranchData} />;
}

function PreflopDrillPage({
  data,
  session,
  onDataChange,
  onSessionChange,
  onResetSession,
  updateDrillType,
  hasRfiData,
  hasFacingOpenData,
  hasThreeBetData,
  hasLimpBranchData,
}: Props & {
  updateDrillType: ReturnType<typeof useDrillQuerySync>['updateDrillType'];
  hasRfiData: boolean;
  hasFacingOpenData: boolean;
  hasThreeBetData: boolean;
  hasLimpBranchData: boolean;
}) {
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
    // buildWeightedHandMap only depends on policy matrix + difficulty; avoid recompute on stats/session updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [situationsPolicyKey, data.settings.difficulty],
  );
  const selectedFocusKey = useMemo(() => {
    const key = data.settings.drillType === 'postflop_hand_category' ? 'rfi' : data.settings.drillType;
    const focus = data.settings.positionFocus[key] as string[];
    return [...focus].sort().join('|');
  }, [data.settings.drillType, data.settings.positionFocus]);
  const selectedVillainKey = useMemo(() => {
    if (data.settings.drillType === 'rfi' || data.settings.drillType === 'postflop_hand_category') return '';
    return [...data.settings.villainFocus[data.settings.drillType]].sort().join('|');
  }, [data.settings.drillType, data.settings.villainFocus]);
  const drillResetKey = `${data.settings.drillType}:${selectedFocusKey}:${selectedVillainKey}:${data.settings.difficulty}:${data.settings.drillContext.format}:${data.settings.drillContext.effectiveStackBb}:${situationsPolicyKey}`;

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
  const isLimpIso = prompt.situation.facingAction === 'limp';
  const isVsIso = prompt.situation.facingAction === 'iso';
  const key = policyKeyFromSituation(
    prompt.situation,
    data.settings.drillContext.format,
    data.settings.drillContext.effectiveStackBb,
  );
  const policy = data.situations[key]?.policy;
  const policyBuckets = policy as
    | Partial<Record<'call' | 'threeBet' | 'fourBet' | 'raise' | 'limp' | 'isoRaise', string[]>>
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
    if (isLimpIso) {
      const iso = policyBuckets?.isoRaise?.length ?? 0;
      return `ISO ${((iso / 169) * 100).toFixed(1)}% • CHECK ${(((169 - iso) / 169) * 100).toFixed(1)}%`;
    }
    if (isVsIso) {
      const call = policyBuckets?.call?.length ?? 0;
      const three = policyBuckets?.threeBet?.length ?? 0;
      return `3bet ${((three / 169) * 100).toFixed(1)}% • Call ${((call / 169) * 100).toFixed(1)}% • Fold ${(((169 - call - three) / 169) * 100).toFixed(1)}%`;
    }
    const raise = policyBuckets?.raise?.length ?? 0;
    const limp = prompt.situation.heroPos === 'SB' ? (policyBuckets?.limp?.length ?? 0) : 0;
    return `Raise ${((raise / 169) * 100).toFixed(1)}%${prompt.situation.heroPos === 'SB' ? ` • Limp ${((limp / 169) * 100).toFixed(1)}%` : ''} • Fold ${(((169 - raise - limp) / 169) * 100).toFixed(1)}%`;
  }, [isFacingOpen, isThreeBet, isLimpIso, isVsIso, policyBuckets, prompt.situation.heroPos]);

  const focusOptions =
    data.settings.drillType === 'rfi'
      ? RFI_POSITIONS
      : data.settings.drillType === 'three_bet'
        ? THREE_BET_HERO_POSITIONS
        : data.settings.drillType === 'limp_branch'
          ? (['BB', 'SB'] as const)
          : FACING_OPEN_HERO_POSITIONS;
  const selectedFocus =
    data.settings.drillType === 'rfi'
      ? data.settings.positionFocus.rfi
      : data.settings.drillType === 'three_bet'
        ? data.settings.positionFocus.three_bet
        : data.settings.drillType === 'limp_branch'
          ? data.settings.positionFocus.limp_branch
          : data.settings.positionFocus.facing_open;

  const selectedVillains: string[] =
    data.settings.drillType === 'facing_open'
      ? data.settings.villainFocus.facing_open
      : data.settings.drillType === 'three_bet'
        ? data.settings.villainFocus.three_bet
        : data.settings.villainFocus.limp_branch;

  const villainOptions = Array.from(
    new Set(
      Object.values(data.situations)
        .filter((record) => {
          if (data.settings.drillType === 'facing_open') return record.drillType === 'facing_open';
          if (data.settings.drillType === 'three_bet') return record.drillType === 'three_bet';
          return data.settings.drillType === 'limp_branch' && record.drillType === 'limp_branch';
        })
        .filter((record) => selectedFocus.length === 0 || selectedFocus.includes(record.situation.heroPos as never))
        .map((record) => record.situation.villainPos)
        .filter((position): position is Exclude<typeof position, undefined> => Boolean(position)),
    ),
  );

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
        hasLimpBranchData={hasLimpBranchData}
        onChange={updateDrillType}
      />

      <PositionFocusSelector
        focusOptions={focusOptions}
        selectedFocus={selectedFocus}
        villainOptions={data.settings.drillType === 'rfi' ? [] : villainOptions}
        selectedVillains={data.settings.drillType === 'rfi' ? [] : selectedVillains}
        onDataChange={onDataChange}
      />

      <div className="card">
        <p>Hero: {prompt.situation.heroPos}</p>
        {(isFacingOpen || isThreeBet || isLimpIso || isVsIso) && (
          <p>
            {isThreeBet ? 'Facing 3-bet from' : isFacingOpen ? 'Facing open from' : isLimpIso ? 'SB limped, hero BB vs' : 'Facing BB ISO from'}: {prompt.situation.villainPos}
          </p>
        )}
        <p className="big-hand">{prompt.handClass}</p>
      </div>

      <DrillActionButtons
        hasPolicy={!!policy}
        isFacingOpen={isFacingOpen}
        isThreeBet={isThreeBet}
        isLimpIso={isLimpIso}
        isVsIso={isVsIso}
        heroPos={prompt.situation.heroPos}
        onAnswer={answer}
      />

      <SessionSummary session={session} drillType={data.settings.drillType} status={status} onResetSession={onResetSession} />

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
