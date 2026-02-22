import { useMemo, useState } from 'react';
import { HandGrid } from '../components/HandGrid';
import { PositionSelector } from '../components/PositionSelector';
import { parseRangeShorthand } from '../lib/parser';
import { type AppData, type Position } from '../lib/types';

type Props = { data: AppData; onDataChange: (updater: (prev: AppData) => AppData) => void };

export function RangesPage({ data, onDataChange }: Props) {
  const [position, setPosition] = useState<Position>('UTG');
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');
  const key = `OPEN_9MAX_100BB_${position}`;

  const openHands = useMemo(() => data.situations[key]?.policy.openHands ?? [], [data, key]);
  const openCount = openHands.length;
  const raisePct = (openCount / 169) * 100;

  const apply = () => {
    const parsed = parseRangeShorthand(text);
    if (!parsed.ok) {
      setMessage(parsed.error);
      return;
    }
    onDataChange((prev) => {
      const next = structuredClone(prev);
      next.situations[key].policy.openHands = parsed.hands;
      return next;
    });
    setMessage(`Applied ${parsed.hands.length} hands to ${position}.`);
  };

  return (
    <section>
      <h2>Ranges</h2>
      <PositionSelector value={position} onChange={setPosition} />
      <div className="card">
        <h3>Range review</h3>
        <p>Raise: {raisePct.toFixed(1)}%</p>
        <p>Fold: {(100 - raisePct).toFixed(1)}%</p>
        <p>
          Open hands: {openCount}/169
        </p>
      </div>
      <HandGrid openHands={openHands} />
      <label htmlFor="range-input">Import range (shorthand)</label>
      <textarea
        id="range-input"
        rows={4}
        placeholder="e.g. 77+,A2s+,KTs+,AQo+"
        value={text}
        onChange={(e: any) => setText(e.target.value)}
      />
      <div className="row">
        <button className="primary" onClick={apply}>
          Apply
        </button>
        <button
          onClick={() => {
            onDataChange((prev) => {
              const next = structuredClone(prev);
              next.situations[key].policy.openHands = [];
              return next;
            });
            setMessage(`Cleared ${position}.`);
          }}
        >
          Clear position
        </button>
      </div>
      {message && <p className="muted">{message}</p>}
    </section>
  );
}
