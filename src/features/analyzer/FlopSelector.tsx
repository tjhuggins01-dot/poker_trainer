import { cardToString } from '../../domain/postflop/cards';
import { CARD_OPTIONS } from '../../domain/postflop-analysis/flopSelection';
import { SIMPLIFIED_BOARD_PRESETS } from '../../domain/postflop-analysis/simplifiedBoards';
import type { BoardInputMode } from '../../domain/postflop-analysis/types';
import type { FlopBoard } from '../../domain/postflop/types';

type Props = {
  boardInputMode: BoardInputMode;
  selected: [string, string, string];
  selectedPresetId: string | null;
  generatedFlop: FlopBoard | null;
  onBoardInputModeChange: (mode: BoardInputMode) => void;
  onChange: (index: number, value: string) => void;
  onPresetChange: (presetId: string) => void;
  error: string | null;
};

export function FlopSelector({
  boardInputMode,
  selected,
  selectedPresetId,
  generatedFlop,
  onBoardInputModeChange,
  onChange,
  onPresetChange,
  error,
}: Props) {
  return (
    <div className="stack">
      <label>Board input mode</label>
      <select value={boardInputMode} onChange={(event) => onBoardInputModeChange(event.target.value as BoardInputMode)}>
        <option value="exact">Exact flop</option>
        <option value="simplified">Simplified board</option>
      </select>

      {boardInputMode === 'exact' && (
        <>
          <label>Exact flop</label>
          <div className="row">
            {selected.map((value, index) => (
              <select key={index} value={value} onChange={(event) => onChange(index, event.target.value)}>
                <option value="">Card {index + 1}</option>
                {CARD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ))}
          </div>
        </>
      )}

      {boardInputMode === 'simplified' && (
        <>
          <label>Simplified board preset</label>
          <select value={selectedPresetId ?? ''} onChange={(event) => onPresetChange(event.target.value)}>
            <option value="">Select a preset</option>
            {SIMPLIFIED_BOARD_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>{preset.label}</option>
            ))}
          </select>
          {generatedFlop && (
            <p className="muted">
              Generated exact flop: <strong>{generatedFlop.map((card) => cardToString(card).toUpperCase()).join(' ')}</strong>
            </p>
          )}
        </>
      )}

      {error && <p className="muted">{error}</p>}
    </div>
  );
}
