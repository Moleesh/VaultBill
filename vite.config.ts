/// <reference types="vitest/config" />

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const appName = process.env.APP_NAME?.trim() || 'VaultBill';
const generatedSlug = appName
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');
const appSlug = generatedSlug || 'vaultbill';
const githubRepositoryName = process.env.GITHUB_REPOSITORY?.split('/').pop()?.trim();
const githubPagesBasePath =
  process.env.VITE_BASE_PATH?.trim() ||
  (githubRepositoryName ? `/${githubRepositoryName}/` : '/');

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
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
  },
});
