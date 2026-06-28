/** @format */

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const npmCliEntrypoint = process.env.npm_execpath;
const electronPackagePath = require.resolve('electron/package.json');
const electronEntrypoint = path.join(path.dirname(electronPackagePath), 'cli.js');
const runCommand = (command, args, env = process.env) =>
    new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: 'inherit',
            env,
        });
        child.on('exit', (code) => {
            if (code === 0) resolve();
            else
                reject(new Error(`${command} ${args.join(' ')} exited with code ${String(code)}.`));
        });
        child.on('error', reject);
    });

if (!npmCliEntrypoint) {
    throw new Error(
        'npm_execpath is unavailable, so the desktop dev runtime cannot start npm tasks.',
    );
}

await runCommand(process.execPath, [npmCliEntrypoint, 'run', 'build:electron']);
await runCommand(process.execPath, [npmCliEntrypoint, 'run', 'build:web']);

console.info(
    'Starting VaultBill desktop with the desktop-hosted web bundle. Renderer changes rebuild into dist/ while Electron serves the app from its local host.',
);

const webWatchProcess = spawn(
    process.execPath,
    [npmCliEntrypoint, 'run', 'build:web', '--', '--watch'],
    {
        stdio: 'inherit',
        env: process.env,
    },
);

let electronProcess;

const stopProcesses = () => {
    webWatchProcess.kill('SIGINT');
    electronProcess?.kill('SIGINT');
};

process.on('SIGINT', stopProcesses);
process.on('SIGTERM', stopProcesses);

electronProcess = spawn(process.execPath, [electronEntrypoint, '.'], {
    stdio: 'inherit',
    env: process.env,
});

webWatchProcess.on('exit', (code) => {
    if (!electronProcess?.killed) electronProcess?.kill('SIGINT');
    process.exit(code ?? 0);
});

electronProcess.on('exit', (code) => {
    if (!webWatchProcess.killed) webWatchProcess.kill('SIGINT');
    process.off('SIGINT', stopProcesses);
    process.off('SIGTERM', stopProcesses);
    process.exit(code ?? 0);
});
