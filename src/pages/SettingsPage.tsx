import { parseRangeShorthand } from '../lib/parser';
import { PRESET_IDS, PRESETS, type PresetId } from '../lib/presets';
import { getStackDataBundle } from '../lib/data/catalog';
import { makeFacingOpenKey, makeRfiKey, makeThreeBetKey } from '../domain/storage/keys';
import { hasNoOverlap } from '../lib/storage';
import { STACK_SIZES_BB } from '../lib/constants';
import { APP_VERSION, RFI_POSITIONS, STORAGE_VERSION, type AppData, type DifficultyMode, type ThemeMode } from '../lib/types';

type Props = {
  data: AppData;
  onDataChange: (updater: (prev: AppData) => AppData) => void;
  onResetSession: () => void;
  onResetStats: () => void;
  onResetAll: () => void;
};

const difficultyOptions: { value: DifficultyMode; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'hard', label: 'Hard (boundary-biased)' },
  { value: 'uniform', label: 'Uniform' },
];

const themeOptions: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function SettingsPage({ data, onDataChange, onResetSession, onResetStats, onResetAll }: Props) {
  return (
    <section>
      <h2>Settings</h2>
      <label htmlFor="difficulty-select">Difficulty</label>
      <select id="difficulty-select" value={data.settings.difficulty} onChange={(e: any) => onDataChange((prev) => ({ ...prev, settings: { ...prev.settings, difficulty: e.target.value as DifficultyMode } }))}>
        {difficultyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>

      <label>
        <input
          type="checkbox"
          checked={data.settings.adaptiveRepetition}
          onChange={(e: any) =>
            onDataChange((prev) => ({
              ...prev,
              settings: {
                ...prev.settings,
                adaptiveRepetition: Boolean(e.target.checked),
              },
            }))
          }
        />
        Adaptive repetition
      </label>
      <p className="muted">Conservative spaced-repetition boost using per-prompt memory. Disable to revert to classic weighting.</p>


      <label htmlFor="theme-select">Theme</label>
      <select
        id="theme-select"
        value={data.settings.themeMode}
        onChange={(e: any) =>
          onDataChange((prev) => ({
            ...prev,
            settings: {
              ...prev.settings,
              themeMode: e.target.value as ThemeMode,
            },
          }))
        }
      >
        {themeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <label htmlFor="stack-select">Effective stack</label>
      <select
        id="stack-select"
        value={data.settings.drillContext.effectiveStackBb}
        onChange={(e: any) =>
          onDataChange((prev) => ({
            ...prev,
            settings: {
              ...prev.settings,
              drillContext: {
                ...prev.settings.drillContext,
                effectiveStackBb: Number(e.target.value) as any,
              },
            },
          }))
        }
      >
        {STACK_SIZES_BB.map((stack) => (
          <option key={stack} value={stack} disabled={!Object.keys(data.situations).some((key) => key.includes(`_${stack}BB_`))}>
            {stack}bb{!Object.keys(data.situations).some((key) => key.includes(`_${stack}BB_`)) ? ' (no data)' : ''}
          </option>
        ))}
      </select>

      <label htmlFor="preset-select">Default preset</label>
      <select id="preset-select" value={data.settings.defaultPresetId} onChange={(e: any) => onDataChange((prev) => ({ ...prev, settings: { ...prev.settings, defaultPresetId: e.target.value as PresetId } }))}>
        {PRESET_IDS.map((presetId) => <option key={presetId} value={presetId}>{PRESETS[presetId].name}</option>)}
      </select>

      <button onClick={() => onDataChange((prev) => {
        const next = structuredClone(prev);
        const preset = PRESETS[prev.settings.defaultPresetId];
        const bundle = getStackDataBundle(prev.settings.drillContext.format, prev.settings.drillContext.effectiveStackBb);
        RFI_POSITIONS.forEach((pos) => {
          const r = parseRangeShorthand(preset.rfi.raise[pos]);
          const rfiKey = makeRfiKey(pos, prev.settings.drillContext.format, prev.settings.drillContext.effectiveStackBb);
          if (r.ok && next.situations[rfiKey]) (next.situations[rfiKey].policy as any).raise = r.hands;
        });
        const l = parseRangeShorthand(preset.rfi.limp.SB);
        const sbKey = makeRfiKey('SB', prev.settings.drillContext.format, prev.settings.drillContext.effectiveStackBb);
        if (l.ok && next.situations[sbKey]) (next.situations[sbKey].policy as any).limp = l.hands;
        Object.entries(preset.facingOpen).forEach(([k, v]) => {
          const [hero, villain] = k.replace('FO_', '').split('_VS_');
          const key = makeFacingOpenKey(hero as any, villain as any, prev.settings.drillContext.format, prev.settings.drillContext.effectiveStackBb);
          const c = parseRangeShorthand(v.call); const t = parseRangeShorthand(v.threeBet);
          if (!c.ok || !t.ok || !hasNoOverlap(c.hands, t.hands)) return;
          if (!next.situations[key]) {
            next.situations[key] = {
              situation: { game: 'NLH', table: '9max', effectiveStackBb: prev.settings.drillContext.effectiveStackBb, heroPos: hero as any, facingAction: 'open', villainPos: villain as any },
              drillType: 'facing_open',
              actionSet: [
                { id: 'FOLD', label: 'FOLD', color: 'fold' },
                { id: 'CALL', label: 'CALL', color: 'call' },
                { id: '3BET', label: '3BET', color: 'threebet' },
              ],
              policy: { call: c.hands as any, threeBet: t.hands as any },
            };
            return;
          }
          (next.situations[key].policy as any).call = c.hands;
          (next.situations[key].policy as any).threeBet = t.hands;
        });

        Object.entries(bundle?.threeBet ?? {}).forEach(([k, v]) => {
          const [hero, villain] = k.split('_VS_');
          const key = makeThreeBetKey(hero as any, villain as any, prev.settings.drillContext.format, prev.settings.drillContext.effectiveStackBb);
          const c = parseRangeShorthand(v.call);
          const f = parseRangeShorthand(v.fourBet);
          if (!c.ok || !f.ok || !hasNoOverlap(c.hands, f.hands)) return;
          if (!next.situations[key]) return;
          (next.situations[key].policy as any).call = c.hands;
          (next.situations[key].policy as any).fourBet = f.hands;
        });
        return next;
      })}>Apply preset to all ranges</button>

      <div className="stack">
        <button onClick={onResetSession}>Reset session</button>
        <button onClick={onResetStats}>Reset historical stats only</button>
        <button className="danger" onClick={onResetAll}>Reset all data (ranges + stats + settings)</button>
      </div>
      <p className="muted">App version: {APP_VERSION}</p>
      <p className="muted">Storage version: {STORAGE_VERSION}</p>
    </section>
  );
}
