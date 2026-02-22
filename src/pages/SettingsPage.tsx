import { parseRangeShorthand } from '../lib/parser';
import { PRESET_IDS, PRESETS, type PresetId } from '../lib/presets';
import { APP_VERSION, STORAGE_VERSION, type AppData, type DifficultyMode } from '../lib/types';

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
      <label className="toggle">
        <input
          type="checkbox"
          checked={data.settings.revealOnIncorrectOnly}
          onChange={(e: any) =>
            onDataChange((prev) => ({
              ...prev,
              settings: { ...prev.settings, revealOnIncorrectOnly: e.target.checked },
            }))
          }
        />
        Reveal range on incorrect only
      </label>

      <label htmlFor="difficulty-select">Difficulty</label>
      <select
        id="difficulty-select"
        value={data.settings.difficulty}
        onChange={(e: any) =>
          onDataChange((prev) => ({
            ...prev,
            settings: { ...prev.settings, difficulty: e.target.value as DifficultyMode },
          }))
        }
      >
        {difficultyOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <label htmlFor="preset-select">Default preset</label>
      <select
        id="preset-select"
        value={data.settings.defaultPresetId}
        onChange={(e: any) =>
          onDataChange((prev) => ({
            ...prev,
            settings: { ...prev.settings, defaultPresetId: e.target.value as PresetId },
          }))
        }
      >
        {PRESET_IDS.map((presetId) => (
          <option key={presetId} value={presetId}>
            {PRESETS[presetId].name}
          </option>
        ))}
      </select>

      <button
        onClick={() =>
          onDataChange((prev) => {
            const next = structuredClone(prev);
            const selectedPreset = PRESETS[prev.settings.defaultPresetId];
            for (const [position, shorthand] of Object.entries(selectedPreset.defaults)) {
              const parsed = parseRangeShorthand(shorthand);
              if (!parsed.ok) continue;
              const key = `OPEN_9MAX_100BB_${position}`;
              next.situations[key].policy.openHands = parsed.hands;
            }
            return next;
          })
        }
      >
        Apply preset to ranges
      </button>

      <div className="stack">
        <button onClick={onResetSession}>Reset session</button>
        <button onClick={onResetStats}>Reset historical stats only</button>
        <button className="danger" onClick={onResetAll}>
          Reset all data (ranges + stats + settings)
        </button>
      </div>
      <p className="muted">App version: {APP_VERSION}</p>
      <p className="muted">Storage version: {STORAGE_VERSION}</p>
    </section>
  );
}
