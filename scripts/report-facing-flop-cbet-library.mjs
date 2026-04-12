import fs from 'node:fs';
import path from 'node:path';

const spotId = 'cash9max-100-btn-vs-co-srp-flop-ip-facing-cbet';
const base = path.join('src/lib/data/postflop-facing-cbet/libraries');
const accepted = JSON.parse(fs.readFileSync(path.join(base, `${spotId}.accepted.json`), 'utf8'));
const review = JSON.parse(fs.readFileSync(path.join(base, `${spotId}.review.json`), 'utf8'));

const hardErrors = [];
const softWarnings = [];

const ensureUnique = (items, label) => {
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item.id)) hardErrors.push(`${label} duplicate id: ${item.id}`);
    seen.add(item.id);
  }
};

ensureUnique(accepted, 'accepted');
ensureUnique(review, 'review');

for (const item of accepted) {
  const unique = new Set([...item.board, ...item.heroHand]);
  if (unique.size !== 5) hardErrors.push(`Card collision: ${item.id}`);

  const handTag = item.tags.find((tag) => tag.startsWith('hand:')) ?? '';
  const boardRanks = new Set(item.board.map((card) => card[0]));
  const handRanks = [item.heroHand[0][0], item.heroHand[1][0]];

  if (handTag === 'hand:pure-air' && handRanks.some((rank) => boardRanks.has(rank))) {
    softWarnings.push(`pure-air overlap with board pair potential: ${item.id}`);
  }
  if (handTag.includes('overcards') && handRanks.some((rank) => boardRanks.has(rank))) {
    softWarnings.push(`overcards label but paired rank found: ${item.id}`);
  }
}

const byBoard = new Map();
for (const item of accepted) {
  const familyTag = item.tags.find((tag) => tag.startsWith('family:')) ?? 'family:unknown';
  const key = `${familyTag}|${item.board.join(' ')}`;
  if (!byBoard.has(key)) byBoard.set(key, { familyTag, board: item.board, small: { fold: 0, call: 0, raise: 0 }, big: { fold: 0, call: 0, raise: 0 }, handClasses: new Set() });
  const row = byBoard.get(key);
  row[item.cBetSizeBucket][item.recommendedResponse] += 1;
  row.handClasses.add(item.tags.find((tag) => tag.startsWith('hand:')) ?? 'hand:unknown');
}

const rejectedByBoard = new Map();
for (const item of review.filter((entry) => !entry.accepted)) {
  const familyTag = item.tags.find((tag) => tag.startsWith('family:')) ?? 'family:unknown';
  const key = `${familyTag}|${item.board.join(' ')}`;
  if (!rejectedByBoard.has(key)) rejectedByBoard.set(key, []);
  rejectedByBoard.get(key).push(`${item.heroHand.join(' ')} (${item.cBetSizeBucket}) => ${item.rejectionReason}`);
}

const lines = [];
lines.push(`Facing Flop C-Bet QA Report for ${spotId}`);
lines.push(`Accepted prompts: ${accepted.length}`);
lines.push(`Review prompts: ${review.length} (rejected: ${review.length - accepted.length})`);
lines.push('');

for (const [key, row] of [...byBoard.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  lines.push(`${row.familyTag} | Board ${row.board.join(' ')}`);
  lines.push(`  small -> fold:${row.small.fold} call:${row.small.call} raise:${row.small.raise}`);
  lines.push(`  big   -> fold:${row.big.fold} call:${row.big.call} raise:${row.big.raise}`);
  lines.push(`  hand classes: ${[...row.handClasses].sort().join(', ')}`);
  const rejected = rejectedByBoard.get(key) ?? [];
  if (rejected.length) {
    lines.push('  rejected candidates:');
    for (const entry of rejected) lines.push(`    - ${entry}`);
  }
  lines.push('');
}

if (softWarnings.length) {
  lines.push('Warnings:');
  for (const warning of softWarnings) lines.push(`  WARN: ${warning}`);
}

if (hardErrors.length) {
  lines.push('Errors:');
  for (const err of hardErrors) lines.push(`  ERROR: ${err}`);
}

console.log(lines.join('\n'));
if (hardErrors.length > 0) process.exit(1);
