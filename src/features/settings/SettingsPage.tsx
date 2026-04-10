import { PRESET_IDS, PRESETS, type PresetId } from '../../lib/presets';
import { STACK_SIZES_BB } from '../../lib/constants';
import { applyPresetToAllRanges } from '../../domain/presets/applyPreset';
import { APP_VERSION, STORAGE_VERSION, type AppData, type DifficultyMode, type ThemeMode } from '../../lib/types';
import { getStackDataBundle } from '../../lib/data/catalog';

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
  { value: 'extra_hard', label: 'Extra hard (boundary-only)' },
  { value: 'uniform', label: 'Uniform' },
];

const themeOptions: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function SettingsPage({ data, onDataChange, onResetSession, onResetStats, onResetAll }: Props) {
  const hasStackData = (stack: number) =>
    Boolean(getStackDataBundle(data.settings.drillContext.format, stack))
    || Object.keys(data.situations).some((key) => key.includes(`_${stack}BB_`));

  return (
    <section>
      <h2>Settings</h2>
      <label htmlFor="difficulty-select">Difficulty</label>
      <select id="difficulty-select" value={data.settings.difficulty} onChange={(e) => onDataChange((prev) => ({ ...prev, settings: { ...prev.settings, difficulty: (e.target as HTMLSelectElement).value as DifficultyMode } }))}>
        {difficultyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>

      <label>
        <input
          type="checkbox"
          checked={data.settings.adaptiveRepetition}
          onChange={(e) =>
            onDataChange((prev) => ({
              ...prev,
              settings: {
                ...prev.settings,
                adaptiveRepetition: Boolean((e.target as HTMLInputElement).checked),
              },
            }))
          }
        />
        Adaptive repetition
      </label>
      <p className="muted">Conservative spaced-repetition boost using per-prompt memory. Disable to revert to classic weighting.</p>



      <label>
        <input
          type="checkbox"
          checked={data.settings.showCorrectAnswerFeedback}
          onChange={(e) =>
            onDataChange((prev) => ({
              ...prev,
              settings: {
                ...prev.settings,
                showCorrectAnswerFeedback: Boolean((e.target as HTMLInputElement).checked),
              },
            }))
          }
        />
        Show feedback on correct postflop answers
      </label>
      <p className="muted">If disabled, correct postflop answers immediately move to the next street/hand.</p>

      <label htmlFor="theme-select">Theme</label>
      <select
        id="theme-select"
        value={data.settings.themeMode}
        onChange={(e) =>
          onDataChange((prev) => ({
            ...prev,
            settings: {
              ...prev.settings,
              themeMode: (e.target as HTMLSelectElement).value as ThemeMode,
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
        onChange={(e) =>
          onDataChange((prev) => ({
            ...prev,
            settings: {
              ...prev.settings,
              drillContext: {
                ...prev.settings.drillContext,
                effectiveStackBb: Number((e.target as HTMLSelectElement).value) as typeof prev.settings.drillContext.effectiveStackBb,
              },
            },
          }))
        }
      >
        {STACK_SIZES_BB.map((stack) => (
          <option key={stack} value={stack} disabled={!hasStackData(stack)}>
            {stack}bb{!hasStackData(stack) ? ' (no data)' : ''}
          </option>
        ))}
      </select>

      <label htmlFor="preset-select">Default preset</label>
      <select id="preset-select" value={data.settings.defaultPresetId} onChange={(e) => onDataChange((prev) => ({ ...prev, settings: { ...prev.settings, defaultPresetId: (e.target as HTMLSelectElement).value as PresetId } }))}>
        {PRESET_IDS.map((presetId) => <option key={presetId} value={presetId}>{PRESETS[presetId].name}</option>)}
      </select>

      <button
        onClick={() =>
          onDataChange((prev) => applyPresetToAllRanges(prev, prev.settings.defaultPresetId, prev.settings.drillContext))
        }
      >
        Apply preset to all ranges
      </button>

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
