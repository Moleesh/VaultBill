/** @format */

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

import {
    fallbackDevWebPort,
    preferredDevWebPort,
    resolveDevWebPort,
} from './DevServerPortSupport.mjs';

const require = createRequire(import.meta.url);
const vitePackagePath = require.resolve('vite/package.json');
const viteEntrypoint = path.join(path.dirname(vitePackagePath), 'bin', 'vite.js');
const requestedPortArgument = process.argv.find((argument) => argument.startsWith('--port='));
const requestedPortValue =
    requestedPortArgument?.replace('--port=', '') ??
    process.argv[process.argv.findIndex((argument) => argument === '--port') + 1];
const port =
    requestedPortValue && /^\d+$/u.test(requestedPortValue)
        ? Number.parseInt(requestedPortValue, 10)
        : await resolveDevWebPort();
const fallbackNotice =
    port === fallbackDevWebPort
        ? ` Port ${String(preferredDevWebPort)} is unavailable, so Vite is using ${String(fallbackDevWebPort)}.`
        : '';

console.info(`Starting VaultBill web client on port ${String(port)}.${fallbackNotice}`);

const viteProcess = spawn(
    process.execPath,
    [viteEntrypoint, '--host', '0.0.0.0', '--port', String(port), '--strictPort'],
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
