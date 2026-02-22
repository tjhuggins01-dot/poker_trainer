import { APP_VERSION, STORAGE_VERSION, type AppData, type DifficultyMode } from '../lib/types';

type Props = {
  data: AppData;
  onDataChange: (updater: (prev: AppData) => AppData) => void;
  onResetSession: () => void;
  onResetStats: () => void;
  onResetAll: () => void;
};

const difficultyOptions: Array<{ value: DifficultyMode; label: string }> = [
  { value: 'normal', label: 'Normal (boundary-biased)' },
  { value: 'hard', label: 'Hard (strong boundary bias)' },
  { value: 'uniform', label: 'Uniform (all 169 equal)' },
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
