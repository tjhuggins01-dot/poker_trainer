import { useEffect } from 'react';
import { fromLegacyDrillType, isEligibleContext, parseContextQuery, toLegacyDrillType } from '../../../lib/domain';
import type { AppData } from '../../../lib/types';

type OnDataChange = (updater: (prev: AppData) => AppData) => void;

export function useDrillQuerySync(data: AppData, onDataChange: OnDataChange) {
  useEffect(() => {
    const parsed = parseContextQuery(new URLSearchParams(window.location.search));
    if (!Object.values(parsed).some(Boolean)) return;
    onDataChange((prev) => {
      const mergedContext = {
        ...prev.settings.drillContext,
        ...parsed,
      };
      const candidateContext = {
        ...mergedContext,
        villainPos: mergedContext.nodeType === 'rfi' ? undefined : mergedContext.villainPos,
      };
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
  }, []);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    q.set('format', data.settings.drillContext.format);
    q.set('stack', String(data.settings.drillContext.effectiveStackBb));
    q.set('node', data.settings.drillContext.nodeType);
    q.set('hero', data.settings.drillContext.heroPos);
    if (data.settings.drillContext.villainPos) q.set('villain', data.settings.drillContext.villainPos);
    else q.delete('villain');
    const nextUrl = `${window.location.pathname}?${q.toString()}${window.location.hash}`;
    window.history.replaceState(null, '', nextUrl);
  }, [data.settings.drillContext]);

  return {
    updateDrillType: (drillType: 'rfi' | 'facing_open' | 'three_bet' | 'limp_branch') => {
      onDataChange((prev) => {
        const nodeType = fromLegacyDrillType(drillType);
        return {
          ...prev,
          settings: {
            ...prev.settings,
            drillType,
            drillContext: {
              ...prev.settings.drillContext,
              nodeType,
              villainPos:
                nodeType === 'rfi' ? undefined : nodeType === 'facingOpen' ? prev.settings.facingOpenSelection.villainPos : nodeType === 'limpBranch' ? (prev.settings.positionFocus.limp_branch[0] === 'BB' ? 'SB' : 'BB') : 'BB',
            },
          },
        };
      });
    },
  };
}
