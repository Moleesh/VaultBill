import { contextBridge, ipcRenderer } from 'electron';

import type { BuildIdentity } from './BuildIdentity.js';
import type { PdfRequest, PdfResult } from './PdfBridge.js';
import type { PrintRequest, PrintResult } from './PrintBridge.js';
import type { PrinterSummary } from './PrinterBridge.js';
import type { RecordCancelRequest, RecordWriteRequest, StoredRecord } from './RecordStore.js';

export type VaultBillDesktopBridge = {
  readonly getAppIdentity: () => Promise<BuildIdentity>;
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
  readonly platform: NodeJS.Platform;
};

const desktopBridge: VaultBillDesktopBridge = {
  getAppIdentity: async () =>
    ipcRenderer.invoke('vaultbill:get-app-identity') as Promise<BuildIdentity>,
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
  platform: process.platform,
};

contextBridge.exposeInMainWorld('vaultBillDesktop', desktopBridge);
