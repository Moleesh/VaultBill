/** @format */

import { spawnSync } from 'node:child_process';
import process from 'node:process';

const suiteName = process.argv[2] ?? 'release';
const isWindows = process.platform === 'win32';
const npmCommand = 'npm';
const npxCommand = 'npx';

const runCommand = (label, command, args) => {
    console.log(`\n==> ${label}`);
    const result = spawnSync(command, args, {
        cwd: process.cwd(),
        stdio: 'inherit',
        shell: isWindows,
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
};

const npmRun = (scriptName) => [npmCommand, ['run', scriptName]];
const npxRun = (...args) => [npxCommand, [...args]];

const commonSteps = [
    ['Format check', ...npmRun('format:check')],
    ['Lint', ...npmRun('lint')],
    ['Typecheck', ...npmRun('typecheck')],
    ['Unit tests', ...npmRun('test:ci')],
    ['Dependency audit', ...npmRun('audit:security')],
    ['Secret scan', ...npmRun('scan:secrets')],
    ['Security tests', ...npmRun('test:security')],
    ['Security configuration', ...npmRun('security:check')],
    ['Install Playwright Chromium', ...npxRun('playwright', 'install', '--with-deps', 'chromium')],
    ['Browser flows', ...npmRun('test:e2e')],
];

const suiteSteps = {
    demo: [...commonSteps, ['Build web', ...npmRun('build:web')]],
    release: [
        ...commonSteps,
        ['Coverage', ...npmRun('coverage:ci')],
        ['First-run database smoke', ...npmRun('smoke:first-run-db:ci')],
        ['Build web and Electron', ...npmRun('build:desktop')],
    ],
    precommit: [
        ...commonSteps,
        ['Coverage', ...npmRun('coverage:ci')],
        ['First-run database smoke', ...npmRun('smoke:first-run-db:ci')],
        ['Build web and Electron', ...npmRun('build:desktop')],
    ],
};

const selectedSteps = suiteSteps[suiteName];

if (!selectedSteps) {
    console.error(
        `Unknown verify suite "${suiteName}". Expected one of: ${Object.keys(suiteSteps).join(', ')}.`,
    );
    process.exit(1);
}

for (const [label, command, args] of selectedSteps) {
    runCommand(label, command, args);
}

console.log(`\n${suiteName} verify suite completed successfully.`);
