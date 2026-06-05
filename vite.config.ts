/// <reference types="vitest/config" />

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const requestedAppName = process.env.APP_NAME?.trim();
const appName =
  requestedAppName === undefined || requestedAppName.length === 0 ? 'VaultBill' : requestedAppName;
const generatedSlug = appName
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');
const appSlug = generatedSlug.length === 0 ? 'vaultbill' : generatedSlug;
const githubRepositoryName = process.env.GITHUB_REPOSITORY?.split('/').pop()?.trim();
const requestedBasePath = process.env.VITE_BASE_PATH?.trim();
const githubPagesBasePath =
  requestedBasePath === undefined || requestedBasePath.length === 0
    ? githubRepositoryName
      ? `/${githubRepositoryName}/`
      : '/'
    : requestedBasePath;

export default defineConfig({
  base: githubPagesBasePath,
  plugins: [react()],
  define: {
    __APP_NAME__: JSON.stringify(appName),
    __APP_SLUG__: JSON.stringify(appSlug),
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
    coverage: {
      reporter: ['text', 'html'],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 65,
        statements: 85,
      },
    },
  },
});
