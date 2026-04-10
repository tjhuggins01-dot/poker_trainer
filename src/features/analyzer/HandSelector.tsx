import { CARD_OPTIONS } from '../../domain/postflop-analysis/flopSelection';
import { CardRow } from '../../components/PlayingCard';

type Props = {
  selected: [string, string];
  error: string | null;
  onChange: (index: number, value: string) => void;
};

export function HandSelector({ selected, error, onChange }: Props) {
  return (
    <div className="stack">
      <label>Exact hand</label>
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
      {selected.every((value) => value) && (
        <p className="muted">
          Selected hand: <CardRow cards={selected as [string, string]} label="Exact hand" />
        </p>
      )}
      {error && <p className="muted">{error}</p>}
    </div>
  );
}
