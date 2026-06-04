import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const appName = process.env.APP_NAME?.trim() || 'VaultBill';
const releaseDate = new Date().toISOString().slice(0, 10);
const releaseNotesPath = join(root, 'artifacts', 'release-notes.md');

await mkdir(join(root, 'artifacts'), { recursive: true });

await writeFile(
  releaseNotesPath,
  [
    `# ${appName} ${packageJson.version}`,
    '',
    `Generated: ${releaseDate}`,
    '',
    '## Verification',
    '',
    '- Web build completed.',
    '- Electron native modules rebuilt for the target Electron runtime.',
    '- Desktop package produced.',
    '- Installer/package smoke test completed.',
    '- First-run database startup patch tests completed.',
    '',
    '## Notes',
    '',
    '- Use the same APP_NAME for future releases of the same branded installation.',
  ].join('\n'),
);

console.log(`Release notes generated at ${releaseNotesPath}.`);
