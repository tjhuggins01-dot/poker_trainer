import { useMemo, useState } from 'react';
import { HandGrid } from '../components/HandGrid';
import { PositionSelector } from '../components/PositionSelector';
import { parseRangeShorthand } from '../lib/parser';
import { facingOpenKey, PRESETS } from '../lib/presets';
import { hasNoOverlap, makeFacingOpenKey, makeRfiKey } from '../lib/storage';
import {
  FACING_OPEN_HERO_POSITIONS,
  FACING_OPEN_VILLAIN_BY_HERO,
  RFI_POSITIONS,
  type AppData,
  type FacingOpenHeroPosition,
  type Position,
  type RfiPosition,
} from '../lib/types';

type Props = { data: AppData; onDataChange: (updater: (prev: AppData) => AppData) => void };

export function RangesPage({ data, onDataChange }: Props) {
  const [mode, setMode] = useState<'rfi' | 'facing_open'>('rfi');
  const [position, setPosition] = useState<RfiPosition>('UTG');
  const [raiseText, setRaiseText] = useState('');
  const [secondaryText, setSecondaryText] = useState('');
  const [message, setMessage] = useState('');

  const facingHero = data.settings.facingOpenSelection.heroPos;
  const villainOptions = FACING_OPEN_VILLAIN_BY_HERO[facingHero];
  const facingVillain = villainOptions.includes(data.settings.facingOpenSelection.villainPos)
    ? data.settings.facingOpenSelection.villainPos
    : villainOptions[0];

  const key = mode === 'rfi' ? makeRfiKey(position, data.settings.drillContext.format, data.settings.drillContext.effectiveStackBb) : makeFacingOpenKey(facingHero, facingVillain, data.settings.drillContext.format, data.settings.drillContext.effectiveStackBb);
  const policy = data.situations[key]?.policy as any;
  const hasSpotData = Boolean(data.situations[key]);

  const actionColors = useMemo(
    () => Object.fromEntries((data.situations[key]?.actionSet ?? []).map((action: any) => [action.id, action.color])),
    [data.situations, key],
  );

  const actionMap = useMemo(() => {
    const map: any = {};
    Object.entries(policy ?? {}).forEach(([bucket, hands]: any) => {
      const actionId =
        bucket === 'raise'
          ? 'RAISE'
          : bucket === 'limp'
            ? 'LIMP'
            : bucket === 'call'
              ? 'CALL'
              : bucket === 'threeBet'
                ? '3BET'
                : bucket === 'fourBet'
                  ? '4BET'
                  : bucket.toUpperCase();
      (hands ?? []).forEach((h: any) => (map[h] = actionId));
    });
    return map;
  }, [policy]);

  const apply = () => {
    const primary = parseRangeShorthand(raiseText);
    const secondary = parseRangeShorthand(secondaryText || '');
    if (!primary.ok) return setMessage(primary.error);
    if (!secondary.ok) return setMessage(secondary.error);
    if (!hasNoOverlap(primary.hands, secondary.hands)) {
      return setMessage('Overlap not allowed between the two ranges.');
    }

    onDataChange((prev) => {
      const next = structuredClone(prev);
      const target = next.situations[key];
      if (!target) return prev;
      const p = target.policy as any;
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
  const counts =
    mode === 'rfi'
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
        <>
          <label>Hero position</label>
          <select
            value={facingHero}
            onChange={(e: any) => {
              const heroPos = e.target.value as FacingOpenHeroPosition;
              const firstVillain = FACING_OPEN_VILLAIN_BY_HERO[heroPos][0];
              const currentVillain = data.settings.facingOpenSelection.villainPos as Position;
              const villainPos = FACING_OPEN_VILLAIN_BY_HERO[heroPos].includes(currentVillain)
                ? currentVillain
                : firstVillain;
              onDataChange((prev) => ({
                ...prev,
                settings: {
                  ...prev.settings,
                  facingOpenSelection: { heroPos, villainPos },
                  drillContext: { ...prev.settings.drillContext, heroPos, villainPos },
                },
              }));
            }}
          >
            {FACING_OPEN_HERO_POSITIONS.map((heroPos) => (
              <option key={heroPos} value={heroPos}>
                {heroPos}
              </option>
            ))}
          </select>

          <label>Villain RFI position</label>
          <select
            value={facingVillain}
            onChange={(e: any) => {
              const villainPos = e.target.value as Position;
              onDataChange((prev) => ({
                ...prev,
                settings: {
                  ...prev.settings,
                  facingOpenSelection: {
                    heroPos: prev.settings.facingOpenSelection.heroPos,
                    villainPos,
                  },
                  drillContext: { ...prev.settings.drillContext, villainPos },
                },
              }));
            }}
          >
            {villainOptions.map((villainPos) => (
              <option key={villainPos} value={villainPos}>
                {villainPos}
              </option>
            ))}
          </select>
          <p className="muted">Selected matchup: {facingOpenKey(facingHero, facingVillain)}</p>
        </>
      )}

      <div className="card">
        <p>{mode === 'rfi' ? `Raise ${pct(counts.a)}%` : `Call ${pct(counts.a)}%`}</p>
        <p>
          {mode === 'rfi' && position === 'SB'
            ? `Limp ${pct(counts.b)}%`
            : mode === 'facing_open'
              ? `3bet ${pct(counts.b)}%`
              : null}
        </p>
        <p>Fold {pct(169 - counts.a - counts.b)}%</p>
      </div>

      {!hasSpotData && <p className="muted">No range data for this format/stack spot yet.</p>}
      <HandGrid actionMap={actionMap} actionColors={actionColors as any} />
      <label>{mode === 'rfi' ? 'Raise import' : 'Call import'}</label>
      <textarea rows={3} value={raiseText} onChange={(e: any) => setRaiseText(e.target.value)} disabled={!hasSpotData} />
      <label>{mode === 'rfi' ? (position === 'SB' ? 'Limp import' : 'Secondary not used') : '3bet import'}</label>
      <textarea
        rows={3}
        value={secondaryText}
        onChange={(e: any) => setSecondaryText(e.target.value)}
        disabled={!hasSpotData || (mode === 'rfi' && position !== 'SB')}
      />
      <div className="row">
        <button className="primary" onClick={apply} disabled={!hasSpotData}>
          Apply
        </button>
        <button
          disabled={!hasSpotData}
          onClick={() => {
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
                const m = preset.facingOpen[facingOpenKey(facingHero, facingVillain)];
                if (m) {
                  const c = parseRangeShorthand(m.call);
                  const t = parseRangeShorthand(m.threeBet);
                  if (c.ok && t.ok && hasNoOverlap(c.hands, t.hands) && next.situations[key]) {
                    (next.situations[key].policy as any).call = c.hands;
                    (next.situations[key].policy as any).threeBet = t.hands;
                  }
                }
              }
              return next;
            });
            setMessage('Reset to preset.');
          }}
        >
          Reset to preset
        </button>
      </div>
      {message && <p className="muted">{message}</p>}
    </section>
  );
}
