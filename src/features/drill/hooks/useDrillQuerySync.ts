import { useEffect, useRef } from 'react';
import { fromLegacyDrillType, isEligibleContext, parseContextQuery, toLegacyDrillType } from '../../../lib/domain';
import type { AppData, DrillType } from '../../../lib/types';

type OnDataChange = (updater: (prev: AppData) => AppData) => void;

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

export function useDrillQuerySync(data: AppData, onDataChange: OnDataChange) {
  const didInitFromQueryRef = useRef(false);

  useEffect(() => {
    if (didInitFromQueryRef.current) return;
    didInitFromQueryRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const parsed = parseContextQuery(params);
    const queryDrill = params.get('drill');
    const hasContextQuery = Object.values(parsed).some(Boolean);

    if (!hasContextQuery && !queryDrill) return;

    onDataChange((prev) => {
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
    });
  }, [onDataChange]);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    q.set('drill', data.settings.drillType);
    if (data.settings.drillType !== 'postflop_hand_category') {
      q.set('format', data.settings.drillContext.format);
      q.set('stack', String(data.settings.drillContext.effectiveStackBb));
      q.set('node', data.settings.drillContext.nodeType);
      q.set('hero', data.settings.drillContext.heroPos);
      if (data.settings.drillContext.villainPos) q.set('villain', data.settings.drillContext.villainPos);
      else q.delete('villain');
    } else {
      q.delete('format');
      q.delete('stack');
      q.delete('node');
      q.delete('hero');
      q.delete('villain');
    }
    const nextUrl = `${window.location.pathname}?${q.toString()}${window.location.hash}`;
    window.history.replaceState(null, '', nextUrl);
  }, [data.settings.drillContext, data.settings.drillType]);

  return {
    updateDrillType: (drillType: DrillType) => {
      onDataChange((prev) => {
        if (drillType === 'postflop_hand_category') {
          return {
            ...prev,
            settings: {
              ...prev.settings,
              drillType,
            },
          };
        }
        const context = buildContextForDrill(prev, drillType);
        return {
          ...prev,
          settings: {
            ...prev.settings,
            drillType,
            drillContext: context,
          },
        };
      });
    },
  };
}
