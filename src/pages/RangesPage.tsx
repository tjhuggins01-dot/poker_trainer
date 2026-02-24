import { useMemo, useState } from 'react';
import { HandGrid } from '../components/HandGrid';
import { PositionSelector } from '../components/PositionSelector';
import { parseRangeShorthand } from '../lib/parser';
import { facingOpenKey, PRESETS } from '../lib/presets';
import { getStackDataBundle } from '../lib/data/catalog';
import { hasNoOverlap } from '../lib/storage';
import { actionSetToColorMap, policyToActionMap } from '../domain/policy/mappers';
import { policyKeyFromSituation } from '../domain/policy/resolver';
import {
  FACING_OPEN_HERO_POSITIONS,
  FACING_OPEN_VILLAIN_BY_HERO,
  RFI_POSITIONS,
  THREE_BET_HERO_POSITIONS,
  THREE_BET_VILLAIN_BY_HERO,
  type AppData,
  type FacingOpenHeroPosition,
  type Position,
  type RfiPosition,
  type ThreeBetHeroPosition,
} from '../lib/types';

type Props = { data: AppData; onDataChange: (updater: (prev: AppData) => AppData) => void };

export function RangesPage({ data, onDataChange }: Props) {
  const [mode, setMode] = useState<'rfi' | 'facing_open' | 'three_bet'>('rfi');
  const [position, setPosition] = useState<RfiPosition>('UTG');
  const [threeBetHero, setThreeBetHero] = useState<ThreeBetHeroPosition>('CO');
  const [raiseText, setRaiseText] = useState('');
  const [secondaryText, setSecondaryText] = useState('');
  const [message, setMessage] = useState('');

  const facingHero = data.settings.facingOpenSelection.heroPos;
  const villainOptions = FACING_OPEN_VILLAIN_BY_HERO[facingHero];
  const facingVillain = villainOptions.includes(data.settings.facingOpenSelection.villainPos)
    ? data.settings.facingOpenSelection.villainPos
    : villainOptions[0];
  const threeBetVillainOptions = THREE_BET_VILLAIN_BY_HERO[threeBetHero];
  const [threeBetVillain, setThreeBetVillain] = useState<Position>(threeBetVillainOptions[0]);

  const validThreeBetVillain = threeBetVillainOptions.includes(threeBetVillain)
    ? threeBetVillain
    : threeBetVillainOptions[0];

  const situation =
    mode === 'rfi'
      ? {
          game: 'NLH' as const,
          table: '9max' as const,
          effectiveStackBb: data.settings.drillContext.effectiveStackBb,
          heroPos: position,
          facingAction: 'none' as const,
        }
      : mode === 'facing_open'
        ? {
            game: 'NLH' as const,
            table: '9max' as const,
            effectiveStackBb: data.settings.drillContext.effectiveStackBb,
            heroPos: facingHero,
            facingAction: 'open' as const,
            villainPos: facingVillain,
          }
        : {
            game: 'NLH' as const,
            table: '9max' as const,
            effectiveStackBb: data.settings.drillContext.effectiveStackBb,
            heroPos: threeBetHero,
            facingAction: 'three_bet' as const,
            villainPos: validThreeBetVillain,
          };
  const key = policyKeyFromSituation(situation, data.settings.drillContext.format, data.settings.drillContext.effectiveStackBb);
  const policy = data.situations[key]?.policy as any;
  const hasSpotData = Boolean(data.situations[key]);

  const actionColors = useMemo(() => actionSetToColorMap(data.situations[key]?.actionSet), [data.situations, key]);

  const actionMap = useMemo(() => policyToActionMap(policy), [policy]);

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
      } else if (mode === 'facing_open') {
        p.call = primary.hands;
        p.threeBet = secondary.hands;
      } else {
        p.call = primary.hands;
        p.fourBet = secondary.hands;
      }
      return next;
    });
    setMessage('Ranges updated.');
  };

  const pct = (n: number) => ((n / 169) * 100).toFixed(1);
  const counts =
    mode === 'rfi'
      ? { a: policy?.raise?.length ?? 0, b: position === 'SB' ? policy?.limp?.length ?? 0 : 0 }
      : mode === 'facing_open'
        ? { a: policy?.call?.length ?? 0, b: policy?.threeBet?.length ?? 0 }
        : { a: policy?.call?.length ?? 0, b: policy?.fourBet?.length ?? 0 };

  return (
    <section>
      <h2>Ranges</h2>
      <label>Mode</label>
      <select value={mode} onChange={(e: any) => setMode(e.target.value)}>
        <option value="rfi">RFI</option>
        <option value="facing_open">Facing Open</option>
        <option value="three_bet">Facing 3-bet</option>
      </select>

      {mode === 'rfi' ? (
        <PositionSelector value={position} options={RFI_POSITIONS} onChange={setPosition} />
      ) : mode === 'facing_open' ? (
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
      ) : (
        <>
          <label>Hero position</label>
          <select
            value={threeBetHero}
            onChange={(e: any) => {
              const heroPos = e.target.value as ThreeBetHeroPosition;
              const firstVillain = THREE_BET_VILLAIN_BY_HERO[heroPos][0];
              setThreeBetHero(heroPos);
              setThreeBetVillain(firstVillain);
            }}
          >
            {THREE_BET_HERO_POSITIONS.map((heroPos) => (
              <option key={heroPos} value={heroPos}>
                {heroPos}
              </option>
            ))}
          </select>

          <label>Villain 3-bet position</label>
          <select value={validThreeBetVillain} onChange={(e: any) => setThreeBetVillain(e.target.value as Position)}>
            {threeBetVillainOptions.map((villainPos) => (
              <option key={villainPos} value={villainPos}>
                {villainPos}
              </option>
            ))}
          </select>
          <p className="muted">Selected matchup: {threeBetHero}_VS_{validThreeBetVillain}</p>
        </>
      )}

      <div className="card">
        <p>{mode === 'rfi' ? `Raise ${pct(counts.a)}%` : `Call ${pct(counts.a)}%`}</p>
        <p>
          {mode === 'rfi' && position === 'SB'
            ? `Limp ${pct(counts.b)}%`
            : mode === 'facing_open'
              ? `3bet ${pct(counts.b)}%`
              : mode === 'three_bet'
                ? `4bet ${pct(counts.b)}%`
              : null}
        </p>
        <p>Fold {pct(169 - counts.a - counts.b)}%</p>
      </div>

      {!hasSpotData && <p className="muted">No range data for this format/stack spot yet.</p>}
      <HandGrid actionMap={actionMap} actionColors={actionColors as any} />
      <label>{mode === 'rfi' ? 'Raise import' : 'Call import'}</label>
      <textarea rows={3} value={raiseText} onChange={(e: any) => setRaiseText(e.target.value)} disabled={!hasSpotData} />
      <label>
        {mode === 'rfi'
          ? position === 'SB'
            ? 'Limp import'
            : 'Secondary not used'
          : mode === 'facing_open'
            ? '3bet import'
            : '4bet import'}
      </label>
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
              } else if (mode === 'facing_open') {
                const m = preset.facingOpen[facingOpenKey(facingHero, facingVillain)];
                if (m) {
                  const c = parseRangeShorthand(m.call);
                  const t = parseRangeShorthand(m.threeBet);
                  if (c.ok && t.ok && hasNoOverlap(c.hands, t.hands) && next.situations[key]) {
                    (next.situations[key].policy as any).call = c.hands;
                    (next.situations[key].policy as any).threeBet = t.hands;
                  }
                }
              } else {
                const bundle = getStackDataBundle(prev.settings.drillContext.format, prev.settings.drillContext.effectiveStackBb);
                const m = bundle?.threeBet[`${threeBetHero}_VS_${validThreeBetVillain}`];
                if (m) {
                  const c = parseRangeShorthand(m.call);
                  const f = parseRangeShorthand(m.fourBet);
                  if (c.ok && f.ok && hasNoOverlap(c.hands, f.hands) && next.situations[key]) {
                    (next.situations[key].policy as any).call = c.hands;
                    (next.situations[key].policy as any).fourBet = f.hands;
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
