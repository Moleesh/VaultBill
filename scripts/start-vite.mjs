/** @format */

import { spawn } from 'node:child_process';

import {
    fallbackDevWebPort,
    preferredDevWebPort,
    resolveDevWebPort,
} from './DevServerPortSupport.mjs';

const viteCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const port = await resolveDevWebPort();
const fallbackNotice =
    port === fallbackDevWebPort
        ? ` Port ${String(preferredDevWebPort)} is unavailable, so Vite is using ${String(fallbackDevWebPort)}.`
        : '';

console.info(`Starting VaultBill web client on port ${String(port)}.${fallbackNotice}`);

const viteProcess = spawn(
    viteCommand,
    ['vite', '--host', '0.0.0.0', '--port', String(port), '--strictPort'],
    {
        stdio: 'inherit',
        env: process.env,
    },
);

const stopVite = () => {
    viteProcess.kill('SIGINT');
};

process.on('SIGINT', stopVite);
process.on('SIGTERM', stopVite);

viteProcess.on('exit', (code) => {
    process.off('SIGINT', stopVite);
    process.off('SIGTERM', stopVite);
    process.exit(code ?? 0);
});
