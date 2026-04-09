import { CARD_OPTIONS } from '../../domain/postflop-analysis/flopSelection';

type Props = {
  selected: [string, string, string];
  onChange: (index: number, value: string) => void;
  error: string | null;
};

export function FlopSelector({ selected, onChange, error }: Props) {
  return (
    <div className="stack">
      <label>Exact flop</label>
      <div className="row">
        {selected.map((value, index) => (
          <select key={index} value={value} onChange={(event) => onChange(index, event.target.value)}>
            <option value="">Card {index + 1}</option>
            {CARD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ))}
      </div>
      {error && <p className="muted">{error}</p>}
    </div>
  );
}
