/** @format */

import { access, readFile } from 'node:fs/promises';

const read = (path) => readFile(path, 'utf8');
const [main, preload, html, vite, packageConfig] = await Promise.all([
    read('electron/MainRuntime.ts'),
    read('electron/Preload.ts'),
    read('index.html'),
    read('vite.config.ts'),
    read('electron-builder.config.cjs'),
]);
const checks = [
    ['contextIsolation enabled', main.includes('contextIsolation: true')],
    ['nodeIntegration disabled', main.includes('nodeIntegration: false')],
    ['renderer sandbox enabled', main.includes('sandbox: true')],
    ['CSP present', html.includes('Content-Security-Policy')],
    ['preload uses contextBridge', preload.includes('contextBridge.exposeInMainWorld')],
    ['fixed web identity', vite.includes("JSON.stringify('VaultBill')")],
    ['fixed desktop identity', packageConfig.includes("productName: 'VaultBill'")],
];

for (const workflow of ['.github/workflows/demo-pages.yml', '.github/workflows/release-app.yml']) {
    try {
        await access(workflow);
        checks.push([`${workflow} exists`, true]);
    } catch {
        checks.push([`${workflow} exists`, false]);
    }
}

try {
    await access('supabase');
    checks.push(['Supabase artifacts removed', false]);
} catch {
    checks.push(['Supabase artifacts removed', true]);
}

const failures = checks.filter(([, passed]) => !passed);
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
if (failures.length > 0) process.exitCode = 1;
