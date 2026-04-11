import { useEffect, useRef } from 'react';
import type { AppData, DrillType } from '../../../lib/types';
import { buildContextForDrillFromData, createOneTimeQueryHydrator } from './queryHydration';

type OnDataChange = (updater: (prev: AppData) => AppData) => void;

export function useDrillQuerySync(data: AppData, onDataChange: OnDataChange) {
  const queryHydratorRef = useRef(createOneTimeQueryHydrator());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasDrillQuery = ['drill', 'format', 'stack', 'node', 'hero', 'villain'].some((key) => params.has(key));
    if (!hasDrillQuery) return;
    onDataChange((prev) => queryHydratorRef.current(prev, params));
  }, [onDataChange]);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    q.set('drill', data.settings.drillType);
    if (
      data.settings.drillType !== 'postflop_hand_category'
      && data.settings.drillType !== 'postflop_range_nut_advantage'
      && data.settings.drillType !== 'postflop_flop_cbet'
    ) {
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
        if (
          drillType === 'postflop_hand_category'
          || drillType === 'postflop_range_nut_advantage'
          || drillType === 'postflop_flop_cbet'
        ) {
          return {
            ...prev,
            settings: {
              ...prev.settings,
              drillType,
            },
          };
        }
        const context = buildContextForDrillFromData(prev, drillType);
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
