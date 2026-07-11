/** @format */

import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
const version = typeof packageJson.version === 'string' ? packageJson.version : '0.0.0';

if (process.platform === 'win32') {
    execFileSync('cmd.exe', ['/c', 'gradlew.bat', 'assembleDebug'], {
        cwd: 'android',
        stdio: 'inherit',
    });
} else {
    execFileSync('bash', ['./gradlew', 'assembleDebug'], {
        cwd: 'android',
        stdio: 'inherit',
    });
}

mkdirSync('release', { recursive: true });
copyFileSync(
    join('android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
    join('release', `vaultbill-${version}-android-debug.apk`),
);
console.log(`Copied Android APK to release/vaultbill-${version}-android-debug.apk.`);
