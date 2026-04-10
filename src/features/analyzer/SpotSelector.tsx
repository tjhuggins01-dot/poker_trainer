import type { FacingOpenHeroPosition, RfiPosition } from '../../lib/types';

type Props = {
  openerOptions: RfiPosition[];
  callerOptions: FacingOpenHeroPosition[];
  openerValue: RfiPosition | null;
  callerValue: FacingOpenHeroPosition | null;
  disabled?: boolean;
  onOpenerChange: (openerPos: RfiPosition) => void;
  onCallerChange: (callerPos: FacingOpenHeroPosition) => void;
};

export function SpotSelector({
  openerOptions,
  callerOptions,
  openerValue,
  callerValue,
  disabled = false,
  onOpenerChange,
  onCallerChange,
}: Props) {
  return (
    <>
      <label>Opener position</label>
      <select
        value={openerValue ?? ''}
        onChange={(event) => onOpenerChange(event.target.value as RfiPosition)}
        disabled={disabled || !openerOptions.length}
      >
        {!openerOptions.length && <option value="">No opener positions available</option>}
        {openerOptions.map((openerPos) => (
          <option key={openerPos} value={openerPos}>
            {openerPos}
          </option>
        ))}
      </select>

      <label>Caller position</label>
      <select
        value={callerValue ?? ''}
        onChange={(event) => onCallerChange(event.target.value as FacingOpenHeroPosition)}
        disabled={disabled || !callerOptions.length}
      >
        {!callerOptions.length && <option value="">No caller positions available</option>}
        {callerOptions.map((callerPos) => (
          <option key={callerPos} value={callerPos}>
            {callerPos}
          </option>
        ))}
      </select>
    </>
  );
}
