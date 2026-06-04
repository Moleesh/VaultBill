import { rebuild } from '@electron/rebuild';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const electronPackage = require('electron/package.json');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

console.log(
  `Rebuilding production native modules for Electron ${electronPackage.version}.`,
);

await rebuild({
  buildPath: root,
  electronVersion: electronPackage.version,
  force: true,
  types: ['prod', 'optional'],
});

console.log('Native module rebuild completed.');
