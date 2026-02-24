import type { DrillType } from '../../../lib/types';

type Props = {
  drillType: DrillType;
  hasRfiData: boolean;
  hasFacingOpenData: boolean;
  hasThreeBetData: boolean;
  onChange: (drillType: DrillType) => void;
};

export function DrillTypeSelector({
  drillType,
  hasRfiData,
  hasFacingOpenData,
  hasThreeBetData,
  onChange,
}: Props) {
  return (
    <>
      <label htmlFor="drill-type">Drill Type</label>
      <select
        id="drill-type"
        value={drillType}
        onChange={(event) => onChange((event.target as HTMLSelectElement).value as DrillType)}
      >
        <option value="rfi" disabled={!hasRfiData}>
          Open First In (RFI){!hasRfiData ? ' (no data)' : ''}
        </option>
        <option value="facing_open" disabled={!hasFacingOpenData}>
          Facing an Open{!hasFacingOpenData ? ' (no data)' : ''}
        </option>
        <option value="three_bet" disabled={!hasThreeBetData}>
          Facing a 3-bet{!hasThreeBetData ? ' (no data)' : ''}
        </option>
      </select>
    </>
  );
}
