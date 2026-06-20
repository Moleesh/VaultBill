/** @format */

import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

import {
    fallbackDevWebPort,
    preferredDevWebPort,
    resolveDevWebPort,
} from './DevServerPortSupport.mjs';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const electronCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const runCommand = (command, args, env = process.env) =>
    new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: 'inherit',
            env,
        });
        child.on('exit', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`${command} ${args.join(' ')} exited with code ${String(code)}.`));
        });
        child.on('error', reject);
    });

const waitForServer = async (url) => {
    for (let attempt = 0; attempt < 60; attempt += 1) {
        try {
            const response = await fetch(url);
            if (response.ok) return;
        } catch {
            // Keep polling until the dev server is ready.
        }
        await delay(500);
    }
    throw new Error(`VaultBill dev server did not become ready at ${url}.`);
};

await runCommand(npmCommand, ['run', 'build:electron']);

const port = await resolveDevWebPort();
const devServerUrl = port === preferredDevWebPort ? 'http://localhost' : `http://localhost:${String(port)}`;
const fallbackNotice =
    port === fallbackDevWebPort
        ? ` Port ${String(preferredDevWebPort)} is unavailable, so the client is using ${String(fallbackDevWebPort)}.`
        : '';

console.info(`Starting VaultBill desktop against ${devServerUrl}.${fallbackNotice}`);

const viteProcess = spawn(
    npmCommand,
    ['run', 'dev'],
    {
        stdio: 'inherit',
        env: {
            ...process.env,
            VITE_WEB_PORT: String(port),
        },
    },
);

let electronProcess;

const stopProcesses = () => {
    viteProcess.kill('SIGINT');
    electronProcess?.kill('SIGINT');
};

process.on('SIGINT', stopProcesses);
process.on('SIGTERM', stopProcesses);

await waitForServer(devServerUrl);

electronProcess = spawn(
    electronCommand,
    ['electron', '.'],
    {
        stdio: 'inherit',
        env: {
            ...process.env,
            VITE_DEV_SERVER_URL: devServerUrl,
        },
    },
);

viteProcess.on('exit', (code) => {
    if (!electronProcess.killed) electronProcess.kill('SIGINT');
    process.exit(code ?? 0);
});

electronProcess.on('exit', (code) => {
    if (!viteProcess.killed) viteProcess.kill('SIGINT');
    process.off('SIGINT', stopProcesses);
    process.off('SIGTERM', stopProcesses);
    process.exit(code ?? 0);
});
