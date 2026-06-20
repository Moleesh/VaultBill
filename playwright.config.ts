/** @format */

import { defineConfig } from '@playwright/test';

const applicationUrl = 'http://127.0.0.1:4173/VaultBill/';

export default defineConfig({
    testDir: './src/__tests__/E2E',
    testMatch: '**/*.spec.ts',
    fullyParallel: false,
    reporter: 'list',
    use: {
        baseURL: applicationUrl,
        trace: 'retain-on-failure',
    },
    webServer: {
        command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
        url: applicationUrl,
        reuseExistingServer: false,
    },
});
