import { parseRangeShorthand } from '../lib/parser';
import { PRESET_IDS, PRESETS, type PresetId } from '../lib/presets';
import { hasNoOverlap, makeFacingOpenKey, makeRfiKey } from '../lib/storage';
import { APP_VERSION, RFI_POSITIONS, STORAGE_VERSION, type AppData, type DifficultyMode } from '../lib/types';

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

export function SettingsPage({ data, onDataChange, onResetSession, onResetStats, onResetAll }: Props) {
  return (
    <section>
      <h2>Settings</h2>
      <label htmlFor="difficulty-select">Difficulty</label>
      <select id="difficulty-select" value={data.settings.difficulty} onChange={(e: any) => onDataChange((prev) => ({ ...prev, settings: { ...prev.settings, difficulty: e.target.value as DifficultyMode } }))}>
        {difficultyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>

      <label htmlFor="preset-select">Default preset</label>
      <select id="preset-select" value={data.settings.defaultPresetId} onChange={(e: any) => onDataChange((prev) => ({ ...prev, settings: { ...prev.settings, defaultPresetId: e.target.value as PresetId } }))}>
        {PRESET_IDS.map((presetId) => <option key={presetId} value={presetId}>{PRESETS[presetId].name}</option>)}
      </select>

      <button onClick={() => onDataChange((prev) => {
        const next = structuredClone(prev);
        const preset = PRESETS[prev.settings.defaultPresetId];
        RFI_POSITIONS.forEach((pos) => {
          const r = parseRangeShorthand(preset.rfi.raise[pos]);
          if (r.ok) (next.situations[makeRfiKey(pos)].policy as any).raise = r.hands;
        });
        const l = parseRangeShorthand(preset.rfi.limp.SB);
        if (l.ok) (next.situations[makeRfiKey('SB')].policy as any).limp = l.hands;
        Object.entries(preset.facingOpen).forEach(([k, v]) => {
          const [hero, villain] = k.replace('FO_', '').split('_VS_');
          const key = makeFacingOpenKey(hero as any, villain as any);
          const c = parseRangeShorthand(v.call); const t = parseRangeShorthand(v.threeBet);
          if (!c.ok || !t.ok || !hasNoOverlap(c.hands, t.hands)) return;
          if (!next.situations[key]) {
            next.situations[key] = {
              situation: { game: 'NLH', table: '9max', effectiveStackBb: 100, heroPos: hero as any, facingAction: 'open', villainPos: villain as any },
              drillType: 'facing_open',
              actionSet: ['FOLD', 'CALL', '3BET'],
              policy: { call: c.hands as any, threeBet: t.hands as any },
            };
            return;
          }
          (next.situations[key].policy as any).call = c.hands;
          (next.situations[key].policy as any).threeBet = t.hands;
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
