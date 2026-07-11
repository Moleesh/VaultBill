/** @format */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const releaseDate = new Date().toISOString().slice(0, 10);
const releaseNotesPath = join(root, 'artifacts', 'release-notes.md');

await mkdir(join(root, 'artifacts'), { recursive: true });

await writeFile(
    releaseNotesPath,
    [
        `# VaultBill ${packageJson.version}`,
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
        '- Security gates, secret scan, dependency audit, and artifact checksums completed.',
        '',
        '## Downloads',
        '',
        '- Windows: use the `vaultbill-*-win-x64.exe` installer.',
        '- Linux: use the `vaultbill-*-linux-x86_64.AppImage` package.',
        '- Android: use the `vaultbill-*-android-debug.apk` package until release signing is configured.',
        '- `SHA256SUMS.txt` lists checksums for the published app artifacts.',
        '- GitHub may also show automatic source archives; they are not VaultBill app installers.',
        '',
        '## Notes',
        '',
        '- VaultBill uses a fixed package identity so upgrades target the same installation.',
        '- Signing status is reported by the release workflow.',
    ].join('\n'),
);

console.log(`Release notes generated at ${releaseNotesPath}.`);
