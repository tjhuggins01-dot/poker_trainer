import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { generateBtnVsBbFlopAdvantageLibrary } from '../src/domain/postflop-analysis/advantageLibrary.ts';

const { accepted, review } = generateBtnVsBbFlopAdvantageLibrary();
const dir = join(process.cwd(), 'src/lib/data/postflop-analysis');
await mkdir(dir, { recursive: true });
await writeFile(join(dir, 'btnVsBbSrpFlopAdvantageLibrary.json'), JSON.stringify(accepted, null, 2) + '\n');
await writeFile(join(dir, 'btnVsBbSrpFlopAdvantageCandidates.json'), JSON.stringify(review, null, 2) + '\n');
console.log(`Generated BTN vs BB SRP flop files: accepted=${accepted.length}, review=${review.length}`);
