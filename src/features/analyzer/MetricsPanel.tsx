import type { ComparativeAnalysis } from '../../domain/postflop-analysis/types';

const pct = (value: number) => `${(value * 100).toFixed(1)}%`;

type Props = {
  analysis: ComparativeAnalysis;
};

export function MetricsPanel({ analysis }: Props) {
  const rows = [
    { label: 'Combos after blockers', hero: String(analysis.hero.comboCount), villain: String(analysis.villain.comboCount) },
    { label: 'Raw equity', hero: analysis.hero.rawEquity == null ? 'N/A' : pct(analysis.hero.rawEquity), villain: analysis.villain.rawEquity == null ? 'N/A' : pct(analysis.villain.rawEquity) },
    { label: 'One pair+', hero: pct(analysis.hero.onePairPlusShare), villain: pct(analysis.villain.onePairPlusShare) },
    { label: 'Two pair+', hero: pct(analysis.hero.twoPairPlusShare), villain: pct(analysis.villain.twoPairPlusShare) },
    { label: 'Trips+', hero: pct(analysis.hero.tripsPlusShare), villain: pct(analysis.villain.tripsPlusShare) },
    { label: 'Straight+', hero: pct(analysis.hero.straightPlusShare), villain: pct(analysis.villain.straightPlusShare) },
    { label: 'Flush', hero: pct(analysis.hero.flushShare), villain: pct(analysis.villain.flushShare) },
    { label: 'Flush draw', hero: pct(analysis.hero.flushDrawShare), villain: pct(analysis.villain.flushDrawShare) },
    { label: 'Open-ended draw', hero: pct(analysis.hero.openEndedShare), villain: pct(analysis.villain.openEndedShare) },
    { label: 'Gutshot', hero: pct(analysis.hero.gutshotShare), villain: pct(analysis.villain.gutshotShare) },
  ];

  return (
    <div className="card">
      <h3>Range metrics</h3>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Hero (opener)</th>
            <th>Villain (caller)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td>{row.hero}</td>
              <td>{row.villain}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
