/** @format */

import { app } from 'electron';
import { rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { mainState } from './MainState.js';

const runtimeProcessInfoPath = () =>
    path.join(app.getPath('temp'), `${mainState.identity.appSlug}-runtime-process.json`);

export const runtimeAppUserModelId = 'com.vaultbill.desktop';

export const getRuntimeProcessInfo = () => ({
    pid: process.pid,
    processName: path.basename(process.execPath),
    execPath: process.execPath,
    cwd: process.cwd(),
    args: process.argv.slice(1),
    appUserModelId: runtimeAppUserModelId,
});

export const writeRuntimeProcessInfoFile = () => {
    writeFileSync(
        runtimeProcessInfoPath(),
        JSON.stringify(getRuntimeProcessInfo(), null, 2),
        'utf8',
    );
};

export const clearRuntimeProcessInfoFile = () => {
    try {
        rmSync(runtimeProcessInfoPath(), { force: true });
    } catch {
        // Ignore cleanup failures during shutdown.
    }
};
