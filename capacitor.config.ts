/** @format */

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.vaultbill.app',
    appName: 'VaultBill',
    webDir: process.env.VAULTBILL_ANDROID === 'true' ? 'dist-android' : 'dist',
    server: {
        androidScheme: 'https',
    },
};

export default config;
