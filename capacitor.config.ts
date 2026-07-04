/** @format */

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.vaultbill.app',
    appName: 'VaultBill',
    webDir: 'dist',
    server: {
        androidScheme: 'https',
    },
};

export default config;
