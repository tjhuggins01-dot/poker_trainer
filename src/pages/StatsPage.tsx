import { FACING_OPEN_HERO_POSITIONS, RFI_POSITIONS, type AppData, type SessionStats } from '../lib/types';

type Props = { data: AppData; session: SessionStats };

const pct = (correct: number, attempts: number): string => (attempts === 0 ? '0.0%' : `${((correct / attempts) * 100).toFixed(1)}%`);

export function StatsPage({ data, session }: Props) {
  const topMistakes = Object.entries(data.stats.mistakes)
    .sort(([, a], [, b]) => b.count - a.count || b.lastTs - a.lastTs)
    .slice(0, 10);

  return (
    <section>
      <h2>Stats</h2>
      <div className="card">
        <p>Historical attempts: {data.stats.total.attempts}</p>
        <p>Historical correct: {data.stats.total.correct}</p>
        <p>Historical accuracy: {pct(data.stats.total.correct, data.stats.total.attempts)}</p>
        <p>Session attempts: {session.attempts}</p>
        <p>Session accuracy: {pct(session.correct, session.attempts)}</p>
      </div>

      <h3>RFI by hero position</h3>
      {RFI_POSITIONS.map((position) => (
        <p key={position}>{position}: {data.stats.byRfiPosition[position].correct}/{data.stats.byRfiPosition[position].attempts} ({pct(data.stats.byRfiPosition[position].correct, data.stats.byRfiPosition[position].attempts)})</p>
      ))}

      <h3>Facing-open by hero position</h3>
      {FACING_OPEN_HERO_POSITIONS.map((position) => (
        <p key={position}>{position}: {data.stats.byFacingHero[position].correct}/{data.stats.byFacingHero[position].attempts} ({pct(data.stats.byFacingHero[position].correct, data.stats.byFacingHero[position].attempts)})</p>
      ))}

      <h3>Facing-open by matchup</h3>
      {Object.entries(data.stats.byFacingMatchup).length === 0 ? <p className="muted">No facing-open attempts yet.</p> : (
        <ul>{Object.entries(data.stats.byFacingMatchup).map(([k, v]) => <li key={k}>{k}: {v.correct}/{v.attempts} ({pct(v.correct, v.attempts)})</li>)}</ul>
      )}

      <h3>Top missed spots</h3>
      {topMistakes.length === 0 ? <p className="muted">No mistakes recorded yet.</p> : (
        <ol>{topMistakes.map(([key, value]) => <li key={key}>{key} — {value.count}</li>)}</ol>
      )}
    </section>
  );
}
