import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

test('qa report script summarizes board/action coverage with no hard errors', () => {
  const output = execFileSync('node', ['scripts/report-facing-flop-cbet-library.mjs'], { encoding: 'utf8' });
  assert.match(output, /Facing Flop C-Bet QA Report/);
  assert.match(output, /Accepted prompts: 144/);
  assert.match(output, /Review prompts: 168 \(rejected: 24\)/);
  assert.doesNotMatch(output, /ERROR:/);
});
