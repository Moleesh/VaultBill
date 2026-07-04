/** @format */

import type { LocalApiHealth } from './LocalApi.types.js';

/** Returns the local API health payload shown to hosted-web clients. */
export const getLocalApiHealth = (appName: string, passwordRequired = true): LocalApiHealth => ({
    appName,
    capabilities: [
        'AccountContext',
        'DocumentFormats',
        'Records',
        'PrintPreview',
        'Reports',
        'BulkImport',
        'BackupCapability',
    ],
    status: 'Ready',
    passwordRequired,
});
