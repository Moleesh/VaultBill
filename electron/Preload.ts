import { contextBridge, ipcRenderer } from 'electron';

import type { BuildIdentity } from './BuildIdentity.js';
import type { DesktopOperatorAccount } from './CredentialStore.js';
import type { PdfRequest, PdfResult } from './PdfBridge.js';
import type { PrintRequest, PrintResult } from './PrintBridge.js';
import type { PrinterSummary } from './PrinterBridge.js';
import type {
  RecordCancelRequest,
  RecordWriteRequest,
  StoredRecord,
  TrialStatus,
} from './RecordStore.js';

export type VaultBillDesktopBridge = {
  readonly getAppIdentity: () => Promise<BuildIdentity>;
  readonly listAccounts: () => Promise<readonly DesktopOperatorAccount[]>;
  readonly loginAccount: (userId: string, password: string) => Promise<DesktopOperatorAccount>;
  readonly saveAccount: (account: unknown) => Promise<DesktopOperatorAccount>;
  readonly archiveAccount: (userId: string) => Promise<void>;
  readonly resetPassword: (userId: string, password: string) => Promise<DesktopOperatorAccount>;
  readonly configureSysAdmin: (displayName: string) => Promise<void>;
  readonly downloadPdf: (request: PdfRequest) => Promise<PdfResult>;
  readonly listPrinters: () => Promise<readonly PrinterSummary[]>;
  readonly printHtml: (request: PrintRequest) => Promise<PrintResult>;
  readonly listRecords: () => Promise<readonly StoredRecord[]>;
  readonly saveDraft: (request: RecordWriteRequest) => Promise<StoredRecord>;
  readonly finalizeRecord: (request: RecordWriteRequest) => Promise<StoredRecord>;
  readonly cancelRecord: (request: RecordCancelRequest) => Promise<StoredRecord>;
  readonly configureLocalApi: (request: {
    readonly lanEnabled: boolean;
    readonly passwordRequired: boolean;
    readonly port: number;
  }) => Promise<unknown>;
  readonly getTrialStatus: () => Promise<TrialStatus>;
  readonly activateLicense: (licenseKey: string) => Promise<TrialStatus>;
  readonly platform: NodeJS.Platform;
};

const desktopBridge: VaultBillDesktopBridge = {
  getAppIdentity: async () =>
    ipcRenderer.invoke('vaultbill:get-app-identity') as Promise<BuildIdentity>,
  listAccounts: async () =>
    ipcRenderer.invoke('vaultbill:accounts:list') as Promise<readonly DesktopOperatorAccount[]>,
  loginAccount: async (userId, password) =>
    ipcRenderer.invoke(
      'vaultbill:accounts:login',
      userId,
      password,
    ) as Promise<DesktopOperatorAccount>,
  saveAccount: async (account) =>
    ipcRenderer.invoke('vaultbill:accounts:save', account) as Promise<DesktopOperatorAccount>,
  archiveAccount: async (userId) =>
    ipcRenderer.invoke('vaultbill:accounts:archive', userId) as Promise<void>,
  resetPassword: async (userId, password) =>
    ipcRenderer.invoke(
      'vaultbill:accounts:reset-password',
      userId,
      password,
    ) as Promise<DesktopOperatorAccount>,
  configureSysAdmin: async (displayName) =>
    ipcRenderer.invoke('vaultbill:setup:sysadmin', displayName) as Promise<void>,
  downloadPdf: async (request) =>
    ipcRenderer.invoke('vaultbill:download-pdf', request) as Promise<PdfResult>,
  listPrinters: async () =>
    ipcRenderer.invoke('vaultbill:list-printers') as Promise<readonly PrinterSummary[]>,
  printHtml: async (request) =>
    ipcRenderer.invoke('vaultbill:print-html', request) as Promise<PrintResult>,
  listRecords: async () =>
    ipcRenderer.invoke('vaultbill:records:list') as Promise<readonly StoredRecord[]>,
  saveDraft: async (request) =>
    ipcRenderer.invoke('vaultbill:records:save-draft', request) as Promise<StoredRecord>,
  finalizeRecord: async (request) =>
    ipcRenderer.invoke('vaultbill:records:finalize', request) as Promise<StoredRecord>,
  cancelRecord: async (request) =>
    ipcRenderer.invoke('vaultbill:records:cancel', request) as Promise<StoredRecord>,
  configureLocalApi: async (request) =>
    ipcRenderer.invoke('vaultbill:local-api:configure', request) as Promise<unknown>,
  getTrialStatus: async () => ipcRenderer.invoke('vaultbill:trial:status') as Promise<TrialStatus>,
  activateLicense: async (licenseKey) =>
    ipcRenderer.invoke('vaultbill:trial:activate', licenseKey) as Promise<TrialStatus>,
  platform: process.platform,
};

contextBridge.exposeInMainWorld('vaultBillDesktop', desktopBridge);
