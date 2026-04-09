import type { AnalyzerSpot } from '../../domain/postflop-analysis/types';

type Props = {
  spots: AnalyzerSpot[];
  value: string | null;
  disabled?: boolean;
  onChange: (spotId: string) => void;
};

export function SpotSelector({ spots, value, disabled = false, onChange }: Props) {
  return (
    <>
      <label>SRP spot</label>
      <select value={value ?? ''} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        <option value="">Select a spot</option>
        {spots.map((spot) => (
          <option key={spot.id} value={spot.id}>
            {spot.label}
          </option>
        ))}
      </select>
    </>
  );
}
