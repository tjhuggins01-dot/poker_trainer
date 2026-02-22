import { POSITIONS, type AppData } from '../lib/types';

type Props = { data: AppData };

const pct = (correct: number, attempts: number): string => {
  if (attempts === 0) return '0.0%';
  return `${((correct / attempts) * 100).toFixed(1)}%`;
};

export function StatsPage({ data }: Props) {
  const totalAttempts = data.stats.total.attempts;
  const totalCorrect = data.stats.total.correct;
  const topMistakes = Object.entries(data.stats.mistakes)
    .sort(([, a], [, b]) => b.count - a.count || b.lastTs - a.lastTs)
    .slice(0, 10);

  return (
    <section>
      <h2>Stats</h2>
      <div className="card">
        <p>Total attempts: {totalAttempts}</p>
        <p>Total correct: {totalCorrect}</p>
        <p>Total accuracy: {pct(totalCorrect, totalAttempts)}</p>
      </div>

      <h3>By position</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Position</th>
              <th>Attempts</th>
              <th>Correct</th>
              <th>Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {POSITIONS.map((position) => {
              const stats = data.stats.byPosition[position];
              return (
                <tr key={position}>
                  <td>{position}</td>
                  <td>{stats.attempts}</td>
                  <td>{stats.correct}</td>
                  <td>{pct(stats.correct, stats.attempts)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h3>Most-missed hands</h3>
      {topMistakes.length === 0 ? (
        <p className="muted">No mistakes recorded yet.</p>
      ) : (
        <ol>
          {topMistakes.map(([key, value]) => (
            <li key={key}>
              {key} — {value.count}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
