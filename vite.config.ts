/// <reference types="vitest/config" />

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

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
    __APP_NAME__: JSON.stringify('VaultBill'),
    __APP_SLUG__: JSON.stringify('vaultbill'),
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
        lines: 70,
        functions: 60,
        branches: 50,
        statements: 70,
      },
    },
  },
});
