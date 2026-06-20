/** @format */

import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const requireInstaller = process.argv.includes('--require-installer');
const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const mainPath = join(root, packageJson.main);
const webIndexPath = join(root, 'dist/index.html');
const runtimePath = join(root, 'dist-electron/MainRuntime.js');
const requiredPaths = [
    'dist/index.html',
    'dist-electron/Main.js',
    'dist-electron/MainRuntime.js',
    'dist-electron/Preload.js',
    packageJson.main,
];

const missingPaths = requiredPaths.filter((path) => !existsSync(join(root, path)));

if (missingPaths.length > 0) {
    throw new Error(`Missing build outputs: ${missingPaths.join(', ')}`);
}

const { getBuildIdentity } = await import(
    pathToFileURL(join(root, 'dist-electron/BuildIdentity.js'))
);
const identity = getBuildIdentity();
const releaseEntries = existsSync(join(root, 'release'))
    ? await readdir(join(root, 'release'), { withFileTypes: true })
    : [];
const hasUnpackedPackage = releaseEntries.some(
    (entry) => entry.isDirectory() && entry.name.endsWith('-unpacked'),
);
const hasInstallerArtifact = releaseEntries.some(
    (entry) =>
        entry.isFile() &&
        /\.(exe|dmg|AppImage|deb|rpm)$/u.test(entry.name) &&
        entry.name.toLowerCase().includes(identity.appSlug),
);

if (!hasUnpackedPackage) {
    throw new Error('No unpacked desktop package found in release/.');
}

if (requireInstaller && !hasInstallerArtifact) {
    throw new Error('No installer artifact found in release/.');
}

if (!existsSync(mainPath)) {
    throw new Error(`Package main entry does not exist: ${packageJson.main}`);
}

const [mainSource, webIndex] = await Promise.all([
    readFile(mainPath, 'utf8'),
    readFile(webIndexPath, 'utf8'),
]);
const runtimeSource = await readFile(runtimePath, 'utf8');
const loadsHostedWorkspace =
    mainSource.includes('loadURL') ||
    /loadURL\((?:process\.env\.[A-Z0-9_]+|hostedAppUrl\(\)|['"]http:\/\/127\.0\.0\.1:4317['"])\)/u.test(
        runtimeSource,
    );
if (!loadsHostedWorkspace) {
    throw new Error('Desktop runtime does not load the hosted VaultBill web application.');
}
if (mainSource.includes('.loadFile(')) {
    throw new Error('Desktop main process must not load the renderer through file://.');
}
if (/https?:\/\/(?:localhost|127\.0\.0\.1):\d+/u.test(webIndex)) {
    throw new Error('Desktop web assets must not point at a development server.');
}

console.log(
    JSON.stringify(
        {
            appName: identity.appName,
            appSlug: identity.appSlug,
            installerRequired: requireInstaller,
            installerFound: hasInstallerArtifact,
            packageMain: packageJson.main,
        },
        null,
        2,
    ),
);
