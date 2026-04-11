import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildSpotLibraryIndex, generateAllSpotLibraries, generateSpotLibrary } from '../src/domain/postflop-analysis/advantageLibrary.ts';
import { ADVANTAGE_SPOT_CONFIGS, getAdvantageSpotConfigById } from '../src/domain/postflop-analysis/advantageLibrarySpots.ts';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const spotIndex = args.indexOf('--spot');
const all = args.includes('--all') || spotIndex === -1;
const spotId = spotIndex >= 0 ? args[spotIndex + 1] : null;

if (spotIndex >= 0 && !spotId) {
  throw new Error('Expected spot id after --spot');
}

const results = all
  ? generateAllSpotLibraries(ADVANTAGE_SPOT_CONFIGS)
  : [generateSpotLibrary(getAdvantageSpotConfigById(spotId))];

const outputDir = join(process.cwd(), 'src/lib/data/postflop-analysis/libraries');
const indexFile = join(outputDir, 'index.json');

const index = buildSpotLibraryIndex(results);

if (!dryRun) {
  await mkdir(outputDir, { recursive: true });
  for (const result of results) {
    await writeFile(join(outputDir, `${result.config.id}.accepted.json`), `${JSON.stringify(result.accepted, null, 2)}\n`);
    await writeFile(join(outputDir, `${result.config.id}.review.json`), `${JSON.stringify({
      spot: result.config,
      stats: result.stats,
      candidates: result.review,
    }, null, 2)}\n`);
  }
  await writeFile(indexFile, `${JSON.stringify(index, null, 2)}\n`);
}

console.log(
  JSON.stringify(
    {
      dryRun,
      generated: results.map((result) => ({
        spotId: result.config.id,
        accepted: result.stats.acceptedCount,
        rejected: result.stats.rejectedCount,
      })),
      indexCount: index.length,
      outputDir,
    },
    null,
    2,
  ),
);
