import { POSITIONS, type Position } from '../lib/types';

type Props = { value: Position; onChange: (p: Position) => void };

export function PositionSelector({ value, onChange }: Props) {
  return (
    <div className="position-selector">
      {POSITIONS.map((p) => (
        <button key={p} className={value === p ? 'active' : ''} onClick={() => onChange(p)}>
          {p}
        </button>
      ))}
    </div>
  );
}
