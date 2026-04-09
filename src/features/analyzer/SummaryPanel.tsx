import type { AnalysisSummary } from '../../domain/postflop-analysis/types';

type Props = {
  summary: AnalysisSummary;
};

export function SummaryPanel({ summary }: Props) {
  return (
    <div className="card">
      <h3>Summary (heuristic)</h3>
      <p>Raw equity edge: <strong>{summary.rawEquityEdge}</strong></p>
      <p>Top-end edge: <strong>{summary.topEndEdge}</strong></p>
      <ul>
        {summary.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
      <p className="muted">This is a range-interaction study view, not solver advice.</p>
    </div>
  );
}
