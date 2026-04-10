import { fromLegacyDrillType, isEligibleContext, parseContextQuery, toLegacyDrillType } from '../../../lib/domain';
import type { AppData, DrillType } from '../../../lib/types';

type CandidateDrillContext = AppData['settings']['drillContext'];

const isDrillType = (value: string | null): value is DrillType =>
  value === 'rfi'
  || value === 'facing_open'
  || value === 'three_bet'
  || value === 'limp_branch'
  || value === 'postflop_hand_category';

const buildContextForDrill = (prev: AppData, drillType: Exclude<DrillType, 'postflop_hand_category'>): CandidateDrillContext => {
  const nodeType = fromLegacyDrillType(drillType);
  return {
    ...prev.settings.drillContext,
    nodeType,
    villainPos:
      nodeType === 'rfi'
        ? undefined
        : nodeType === 'facingOpen'
          ? prev.settings.facingOpenSelection.villainPos
          : nodeType === 'limpBranch'
            ? (prev.settings.positionFocus.limp_branch[0] === 'BB' ? 'SB' : 'BB')
            : 'BB',
  };
};

const mergeParsedContext = (base: CandidateDrillContext, parsed: Partial<CandidateDrillContext>): CandidateDrillContext => {
  const merged = { ...base, ...parsed };
  return {
    ...merged,
    villainPos: merged.nodeType === 'rfi' ? undefined : merged.villainPos,
  };
};

export const hydrateDrillFromQuery = (prev: AppData, params: URLSearchParams): AppData => {
  const parsed = parseContextQuery(params);
  const queryDrill = params.get('drill');
  const hasContextQuery = Object.values(parsed).some(Boolean);

  if (!hasContextQuery && !queryDrill) return prev;

  if (isDrillType(queryDrill)) {
    if (queryDrill === 'postflop_hand_category') {
      return {
        ...prev,
        settings: {
          ...prev.settings,
          drillType: queryDrill,
        },
      };
    }

    const baseContext = buildContextForDrill(prev, queryDrill);
    const candidateContext = hasContextQuery ? mergeParsedContext(baseContext, parsed) : baseContext;

    return {
      ...prev,
      settings: {
        ...prev.settings,
        drillType: queryDrill,
        drillContext: isEligibleContext(candidateContext, prev) ? candidateContext : baseContext,
      },
    };
  }

  if (!hasContextQuery || prev.settings.drillType === 'postflop_hand_category') {
    return prev;
  }

  const candidateContext = mergeParsedContext(prev.settings.drillContext, parsed);
  if (!isEligibleContext(candidateContext, prev)) {
    return prev;
  }
  return {
    ...prev,
    settings: {
      ...prev.settings,
      drillContext: candidateContext,
      drillType: toLegacyDrillType(candidateContext.nodeType),
    },
  };
};

export const createOneTimeQueryHydrator = () => {
  let didApply = false;
  return (prev: AppData, params: URLSearchParams): AppData => {
    if (didApply) return prev;
    didApply = true;
    return hydrateDrillFromQuery(prev, params);
  };
};
