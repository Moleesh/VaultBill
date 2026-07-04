/** @format */

import { execFileSync } from 'node:child_process';
import process from 'node:process';

if (process.platform === 'win32') {
    execFileSync('cmd.exe', ['/c', 'gradlew.bat', 'assembleDebug'], {
        cwd: 'android',
        stdio: 'inherit',
    });
} else {
    execFileSync('./gradlew', ['assembleDebug'], {
        cwd: 'android',
        stdio: 'inherit',
    });
}
