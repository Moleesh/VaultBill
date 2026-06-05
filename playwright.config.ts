import { defineConfig } from '@playwright/test';

const requestedBasePath = process.env.VITE_BASE_PATH?.trim() ?? '/';
const normalizedBasePath = `/${requestedBasePath.replace(/^\/+|\/+$/gu, '')}`;
const applicationUrl = `http://127.0.0.1:5173${
  normalizedBasePath === '/' ? '/' : `${normalizedBasePath}/`
}`;

export default defineConfig({
  testDir: './src/__tests__/E2E',
  testMatch: '**/*.e2e.ts',
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: applicationUrl,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: applicationUrl,
    reuseExistingServer: true,
  },
});
