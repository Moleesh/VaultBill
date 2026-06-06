import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const releaseDirectory = 'release';
const files = (await readdir(releaseDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name !== 'SHA256SUMS.txt')
  .map((entry) => entry.name)
  .sort();
const lines = [];

for (const file of files) {
  const digest = createHash('sha256')
    .update(await readFile(join(releaseDirectory, file)))
    .digest('hex');
  lines.push(`${digest}  ${file}`);
}

if (lines.length === 0) throw new Error('No release artifacts were found for checksums.');
await writeFile(join(releaseDirectory, 'SHA256SUMS.txt'), `${lines.join('\n')}\n`);
console.log(`Generated checksums for ${String(lines.length)} release artifacts.`);
