/** @format */

/// <reference types="vitest/config" />

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const requestedBasePath = process.env.VITE_BASE_PATH?.trim();
const applicationBasePath =
    requestedBasePath === undefined || requestedBasePath.length === 0 ? '/' : requestedBasePath;

export default defineConfig({
    base: applicationBasePath,
    plugins: [react()],
    define: {
        __APP_NAME__: JSON.stringify('VaultBill'),
        __APP_SLUG__: JSON.stringify('vaultbill'),
    },
    server: {
        host: '0.0.0.0',
        port: Number.parseInt(process.env.VITE_WEB_PORT ?? '80', 10),
        strictPort: false,
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
    },
    test: {
        include: [
            'src/**/*.{spec,test}.{ts,tsx,js,jsx}',
            'electron/**/*.{spec,test}.{ts,tsx,js,jsx}',
        ],
        environment: 'jsdom',
        globals: true,
        exclude: ['node_modules/**', 'dist/**', 'src/__tests__/E2E/**'],
        setupFiles: './vitest.setup.ts',
        coverage: {
            reporter: ['text', 'html'],
            exclude: [
                'electron/Main.ts',
                'electron/PdfBridge.ts',
                'electron/Preload.ts',
                'electron/PrintBridge.ts',
                'src/App.tsx',
                'src/main.tsx',
                'src/components/**',
                'src/features/**/*Page.tsx',
                'src/features/auth/SessionContext.tsx',
                'src/features/records/BulkRecordSelection.tsx',
                'src/features/records/RecordStoreContext.tsx',
                'src/runtime/HostedApi.ts',
            ],
            thresholds: {
                lines: 70,
                functions: 60,
                branches: 50,
                statements: 70,
            },
        },
    },
});
