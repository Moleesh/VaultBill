import type { LocalApiHealth } from './LocalApi.types.js';

export const getLocalApiHealth = (appName: string): LocalApiHealth => ({
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
  passwordRequired: false,
});
