import { FACING_OPEN_HERO_POSITIONS, RFI_POSITIONS, type AppData, type DrillType, type SessionStats } from '../../lib/types';

type Props = { data: AppData; session: SessionStats };

type MatchupRow = {
  matchup: string;
  attempts: number;
  correct: number;
  accuracy: string;
};

const pct = (correct: number, attempts: number): string => (attempts === 0 ? '0.0%' : `${((correct / attempts) * 100).toFixed(1)}%`);
const drillLabel: Record<DrillType, string> = {
  rfi: 'RFI',
  facing_open: 'Facing Open',
  three_bet: 'Facing 3-Bet',
  limp_branch: 'Limp Branch',
  postflop_hand_category: 'Postflop Hand Category',
  postflop_range_nut_advantage: 'Postflop Range / Nut Advantage',
  postflop_flop_cbet: 'Postflop Flop C-Bet',
  postflop_facing_flop_cbet: 'Postflop Facing Flop C-Bet',
};

export function StatsPage({ data, session }: Props) {
  const topMistakes = Object.entries(data.stats.mistakes)
    .sort(([, a], [, b]) => b.count - a.count || b.lastTs - a.lastTs)
    .slice(0, 10);
  const topRangeNutMisses = Object.entries(data.stats.postflop.rangeNutAdvantage.missedBoards)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  const topFlopCBetMisses = Object.entries(data.stats.postflop.flopCBet.missedBoards)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  const topFacingFlopCBetMisses = Object.entries(data.stats.postflop.facingFlopCBet.missedPrompts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const matchupRows: MatchupRow[] = Object.entries(data.stats.byFacingMatchup)
    .map(([matchup, stats]) => ({
      matchup,
      attempts: stats.attempts,
      correct: stats.correct,
      accuracy: pct(stats.correct, stats.attempts),
    }))
    .sort((a, b) => b.attempts - a.attempts || b.correct - a.correct || a.matchup.localeCompare(b.matchup));

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

      <h3>Historical by drill</h3>
      {Object.entries(data.stats.byDrill).map(([drill, stats]) => (
        <p key={drill}>{drillLabel[drill as DrillType]}: {stats.correct}/{stats.attempts} ({pct(stats.correct, stats.attempts)}) • Avg {stats.attempts === 0 ? 0 : (data.stats.byDrillResponseMs[drill as DrillType] / stats.attempts).toFixed(0)}ms</p>
      ))}

      <h3>RFI by hero position</h3>
      {RFI_POSITIONS.map((position) => (
        <p key={position}>{position}: {data.stats.byRfiPosition[position].correct}/{data.stats.byRfiPosition[position].attempts} ({pct(data.stats.byRfiPosition[position].correct, data.stats.byRfiPosition[position].attempts)})</p>
      ))}

      <h3>Facing-open by hero position</h3>
      {FACING_OPEN_HERO_POSITIONS.map((position) => (
        <p key={position}>{position}: {data.stats.byFacingHero[position].correct}/{data.stats.byFacingHero[position].attempts} ({pct(data.stats.byFacingHero[position].correct, data.stats.byFacingHero[position].attempts)})</p>
      ))}

      <h3>Facing-open by matchup</h3>
      {matchupRows.length === 0 ? (
        <p className="muted">No facing-open attempts yet.</p>
      ) : (
        <div className="matchup-grid" role="table" aria-label="Facing-open matchup stats">
          <div className="matchup-grid-header" role="row">
            <span>Matchup</span>
            <span>Attempts</span>
            <span>Correct</span>
            <span>Accuracy</span>
          </div>
          {matchupRows.map((row) => (
            <div className="matchup-grid-row" role="row" key={row.matchup}>
              <strong>{row.matchup}</strong>
              <span>{row.attempts}</span>
              <span>{row.correct}</span>
              <span>{row.accuracy}</span>
            </div>
          ))}
        </div>
      )}

      <h3>Postflop hand category</h3>
      <p>Answered: {data.stats.postflop.handCategory.totalAnswered}</p>
      <p>Correct: {data.stats.postflop.handCategory.correct}</p>
      <p>Accuracy: {pct(data.stats.postflop.handCategory.correct, data.stats.postflop.handCategory.totalAnswered)}</p>

      <h3>Postflop range / nut advantage</h3>
      <p>Prompts: {data.stats.postflop.rangeNutAdvantage.attempts}</p>
      <p>Fully correct: {data.stats.postflop.rangeNutAdvantage.fullyCorrect}</p>
      <p>Range accuracy: {pct(data.stats.postflop.rangeNutAdvantage.rangeCorrect, data.stats.postflop.rangeNutAdvantage.attempts)}</p>
      <p>Nut accuracy: {pct(data.stats.postflop.rangeNutAdvantage.nutCorrect, data.stats.postflop.rangeNutAdvantage.attempts)}</p>
      <p>Top missed boards: {topRangeNutMisses.length}</p>
      {topRangeNutMisses.length > 0 && (
        <ol>
          {topRangeNutMisses.map(([boardKey, misses]) => (
            <li key={boardKey}>{boardKey} — {misses}</li>
          ))}
        </ol>
      )}

      <h3>Postflop flop c-bet</h3>
      <p>Prompts: {data.stats.postflop.flopCBet.attempts}</p>
      <p>Correct: {data.stats.postflop.flopCBet.correct}</p>
      <p>Accuracy: {pct(data.stats.postflop.flopCBet.correct, data.stats.postflop.flopCBet.attempts)}</p>
      <p>Top missed boards: {topFlopCBetMisses.length}</p>
      {topFlopCBetMisses.length > 0 && (
        <ol>
          {topFlopCBetMisses.map(([boardKey, misses]) => (
            <li key={boardKey}>{boardKey} — {misses}</li>
          ))}
        </ol>
      )}

      <h3>Postflop facing flop c-bet</h3>
      <p>Prompts: {data.stats.postflop.facingFlopCBet.attempts}</p>
      <p>Correct: {data.stats.postflop.facingFlopCBet.correct}</p>
      <p>Accuracy: {pct(data.stats.postflop.facingFlopCBet.correct, data.stats.postflop.facingFlopCBet.attempts)}</p>
      <p>Top missed prompts: {topFacingFlopCBetMisses.length}</p>
      {topFacingFlopCBetMisses.length > 0 && (
        <ol>
          {topFacingFlopCBetMisses.map(([promptKey, misses]) => (
            <li key={promptKey}>{promptKey} — {misses}</li>
          ))}
        </ol>
      )}

      <h3>Top missed spots</h3>
      {topMistakes.length === 0 ? <p className="muted">No mistakes recorded yet.</p> : (
        <ol>{topMistakes.map(([key, value]) => <li key={key}>{key} — {value.count}</li>)}</ol>
      )}
    </section>
  );
}
