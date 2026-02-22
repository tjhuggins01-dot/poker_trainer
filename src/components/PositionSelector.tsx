type Props<T extends string> = { value: T; options: readonly T[]; onChange: (p: T) => void };

export function PositionSelector<T extends string>({ value, options, onChange }: Props<T>) {
  return (
    <div className="position-selector">
      {options.map((p) => (
        <button key={p} className={value === p ? 'active' : ''} onClick={() => onChange(p)}>
          {p}
        </button>
      ))}
    </div>
  );
}
