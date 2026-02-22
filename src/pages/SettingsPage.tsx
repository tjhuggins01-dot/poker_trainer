import { APP_VERSION, STORAGE_VERSION, type AppData } from '../lib/types';

type Props = {
  data: AppData;
  onDataChange: (updater: (prev: AppData) => AppData) => void;
  onResetStats: () => void;
  onResetAll: () => void;
};

export function SettingsPage({ data, onDataChange, onResetStats, onResetAll }: Props) {
  return (
    <section>
      <h2>Settings</h2>
      <label className="toggle">
        <input
          type="checkbox"
          checked={data.settings.revealOnIncorrectOnly}
          onChange={(e) =>
            onDataChange((prev) => ({
              ...prev,
              settings: { ...prev.settings, revealOnIncorrectOnly: e.target.checked },
            }))
          }
        />
        Reveal range on incorrect only
      </label>
      <div className="stack">
        <button onClick={onResetStats}>Reset stats only</button>
        <button className="danger" onClick={onResetAll}>
          Reset all data (ranges + stats + settings)
        </button>
      </div>
      <p className="muted">App version: {APP_VERSION}</p>
      <p className="muted">Storage version: {STORAGE_VERSION}</p>
    </section>
  );
}
