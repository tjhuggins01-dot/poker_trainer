import { useMemo, useState } from 'react';
import { HandGrid } from '../components/HandGrid';
import { PositionSelector } from '../components/PositionSelector';
import { getFacingOpenPairs } from '../lib/logic';
import { parseRangeShorthand } from '../lib/parser';
import { facingOpenKey, PRESETS } from '../lib/presets';
import { makeFacingOpenKey, makeRfiKey } from '../lib/storage';
import { RFI_POSITIONS, type AppData, type FacingOpenHeroPosition, type Position, type RfiPosition } from '../lib/types';

type Props = { data: AppData; onDataChange: (updater: (prev: AppData) => AppData) => void };

export function RangesPage({ data, onDataChange }: Props) {
  const [mode, setMode] = useState<'rfi' | 'facing_open'>('rfi');
  const [position, setPosition] = useState<RfiPosition>('UTG');
  const pairs = getFacingOpenPairs(data);
  const [facingPair, setFacingPair] = useState<{ heroPos: FacingOpenHeroPosition; villainPos: Position }>(pairs[0]);
  const [raiseText, setRaiseText] = useState('');
  const [secondaryText, setSecondaryText] = useState('');
  const [message, setMessage] = useState('');

  const key = mode === 'rfi' ? makeRfiKey(position) : makeFacingOpenKey(facingPair.heroPos, facingPair.villainPos);
  const policy = data.situations[key]?.policy as any;

  const actionMap = useMemo(() => {
    const map: any = {};
    (policy?.raise ?? []).forEach((h: any) => (map[h] = 'raise'));
    (policy?.limp ?? []).forEach((h: any) => (map[h] = 'limp'));
    (policy?.call ?? []).forEach((h: any) => (map[h] = 'call'));
    (policy?.threeBet ?? []).forEach((h: any) => (map[h] = 'threebet'));
    return map;
  }, [policy]);

  const apply = () => {
    const primary = parseRangeShorthand(raiseText);
    const secondary = parseRangeShorthand(secondaryText || '');
    if (!primary.ok) return setMessage(primary.error);
    if (!secondary.ok) return setMessage(secondary.error);
    const overlap = primary.hands.filter((h) => secondary.hands.includes(h));
    if (overlap.length > 0) return setMessage(`Overlap not allowed (${overlap.slice(0, 5).join(', ')}...)`);

    onDataChange((prev) => {
      const next = structuredClone(prev);
      const p = next.situations[key].policy as any;
      if (mode === 'rfi') {
        p.raise = primary.hands;
        if (position === 'SB') p.limp = secondary.hands;
      } else {
        p.call = primary.hands;
        p.threeBet = secondary.hands;
      }
      return next;
    });
    setMessage('Ranges updated.');
  };

  const pct = (n: number) => ((n / 169) * 100).toFixed(1);
  const counts = mode === 'rfi'
    ? { a: policy?.raise?.length ?? 0, b: position === 'SB' ? policy?.limp?.length ?? 0 : 0 }
    : { a: policy?.call?.length ?? 0, b: policy?.threeBet?.length ?? 0 };

  return (
    <section>
      <h2>Ranges</h2>
      <label>Mode</label>
      <select value={mode} onChange={(e: any) => setMode(e.target.value)}>
        <option value="rfi">RFI</option>
        <option value="facing_open">Facing Open</option>
      </select>

      {mode === 'rfi' ? (
        <PositionSelector value={position} options={RFI_POSITIONS} onChange={setPosition} />
      ) : (
        <select
          value={facingOpenKey(facingPair.heroPos, facingPair.villainPos)}
          onChange={(e: any) => {
            const found = pairs.find((p) => facingOpenKey(p.heroPos, p.villainPos) === e.target.value);
            if (found) setFacingPair(found);
          }}
        >
          {pairs.map((p) => (
            <option key={facingOpenKey(p.heroPos, p.villainPos)} value={facingOpenKey(p.heroPos, p.villainPos)}>
              {p.heroPos} vs {p.villainPos}
            </option>
          ))}
        </select>
      )}

      <div className="card">
        <p>{mode === 'rfi' ? `Raise ${pct(counts.a)}%` : `Call ${pct(counts.a)}%`}</p>
        <p>
          {mode === 'rfi' && position === 'SB' ? `Limp ${pct(counts.b)}%` : mode === 'facing_open' ? `3bet ${pct(counts.b)}%` : null}
        </p>
        <p>Fold {pct(169 - counts.a - counts.b)}%</p>
      </div>

      <HandGrid actionMap={actionMap} />
      <label>{mode === 'rfi' ? 'Raise import' : 'Call import'}</label>
      <textarea rows={3} value={raiseText} onChange={(e: any) => setRaiseText(e.target.value)} />
      <label>{mode === 'rfi' ? (position === 'SB' ? 'Limp import' : 'Secondary not used') : '3bet import'}</label>
      <textarea rows={3} value={secondaryText} onChange={(e: any) => setSecondaryText(e.target.value)} disabled={mode === 'rfi' && position !== 'SB'} />
      <div className="row">
        <button className="primary" onClick={apply}>Apply</button>
        <button onClick={() => {
          const preset = PRESETS[data.settings.defaultPresetId];
          onDataChange((prev) => {
            const next = structuredClone(prev);
            if (mode === 'rfi') {
              const parsedRaise = parseRangeShorthand(preset.rfi.raise[position]);
              if (parsedRaise.ok) (next.situations[key].policy as any).raise = parsedRaise.hands;
              if (position === 'SB') {
                const parsedLimp = parseRangeShorthand(preset.rfi.limp.SB);
                if (parsedLimp.ok) (next.situations[key].policy as any).limp = parsedLimp.hands;
              }
            } else {
              const m = preset.facingOpen[facingOpenKey(facingPair.heroPos, facingPair.villainPos)];
              if (m) {
                const c = parseRangeShorthand(m.call); const t = parseRangeShorthand(m.threeBet);
                if (c.ok) (next.situations[key].policy as any).call = c.hands;
                if (t.ok) (next.situations[key].policy as any).threeBet = t.hands;
              }
            }
            return next;
          });
          setMessage('Reset to preset.');
        }}>Reset to preset</button>
      </div>
      {message && <p className="muted">{message}</p>}
    </section>
  );
}
