import type { AppData } from '../../../lib/types';

type Props = {
  focusOptions: readonly string[];
  selectedFocus: readonly string[];
  onDataChange: (updater: (prev: AppData) => AppData) => void;
};

export function PositionFocusSelector({ focusOptions, selectedFocus, onDataChange }: Props) {
  const onPositionToggle = (position: string, checked: boolean) => {
    onDataChange((prev) => {
      const next = structuredClone(prev);
      const keyFocus = prev.settings.drillType;
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

  return (
    <>
      <p className="muted">Position Focus</p>
      <div className="row wrap">
        {focusOptions.map((position) => (
          <label key={position}>
            <input
              type="checkbox"
              checked={selectedFocus.includes(position)}
              onChange={(event) => onPositionToggle(position, (event.target as HTMLInputElement).checked)}
            />{' '}
            {position}
          </label>
        ))}
      </div>
    </>
  );
}
