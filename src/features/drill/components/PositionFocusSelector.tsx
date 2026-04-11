import type { AppData } from '../../../lib/types';

type Props = {
  focusOptions: readonly string[];
  selectedFocus: readonly string[];
  villainOptions?: readonly string[];
  selectedVillains?: readonly string[];
  onDataChange: (updater: (prev: AppData) => AppData) => void;
};

export function PositionFocusSelector({
  focusOptions,
  selectedFocus,
  villainOptions = [],
  selectedVillains = [],
  onDataChange,
}: Props) {
  const onPositionToggle = (position: string, checked: boolean) => {
    onDataChange((prev) => {
      const next = structuredClone(prev);
      const keyFocus =
        prev.settings.drillType === 'postflop_hand_category' || prev.settings.drillType === 'postflop_range_nut_advantage'
          ? 'rfi'
          : prev.settings.drillType;
      const list = new Set(next.settings.positionFocus[keyFocus]);
      if (checked) list.add(position as never);
      else list.delete(position as never);
      next.settings.positionFocus[keyFocus] = [...list] as never;
      const selected = [...list][0] as string | undefined;
      if (selected) {
        next.settings.drillContext.heroPos = selected as never;
      }
      return next;
    });
  };

  const onVillainToggle = (position: string, checked: boolean) => {
    onDataChange((prev) => {
      if (
        prev.settings.drillType === 'rfi'
        || prev.settings.drillType === 'postflop_hand_category'
        || prev.settings.drillType === 'postflop_range_nut_advantage'
      ) return prev;
      const next = structuredClone(prev);
      const list = new Set(next.settings.villainFocus[prev.settings.drillType]);
      if (checked) list.add(position as never);
      else list.delete(position as never);
      next.settings.villainFocus[prev.settings.drillType] = [...list] as never;
      return next;
    });
  };

  return (
    <>
      <p className="muted">Position Focus</p>
      <div className="row wrap">
        {focusOptions.map((position) => (
          <label key={position}>
            <input
              type="checkbox"
              checked={selectedFocus.includes(position)}
              onChange={(event) => onPositionToggle(position, event.target.checked)}
            />{' '}
            {position}
          </label>
        ))}
      </div>
      {villainOptions.length > 0 && (
        <>
          <p className="muted">Villain Focus</p>
          <div className="row wrap">
            {villainOptions.map((position) => (
              <label key={position}>
                <input
                  type="checkbox"
                  checked={selectedVillains.includes(position)}
                  onChange={(event) => onVillainToggle(position, event.target.checked)}
                />{' '}
                {position}
              </label>
            ))}
          </div>
        </>
      )}
    </>
  );
}
