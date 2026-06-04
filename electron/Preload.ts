import { contextBridge, ipcRenderer } from 'electron';

import type { BuildIdentity } from './BuildIdentity.js';
import type { PdfRequest, PdfResult } from './PdfBridge.js';
import type { PrintRequest, PrintResult } from './PrintBridge.js';
import type { PrinterSummary } from './PrinterBridge.js';

export type VaultBillDesktopBridge = {
  readonly getAppIdentity: () => Promise<BuildIdentity>;
  readonly downloadPdf: (request: PdfRequest) => Promise<PdfResult>;
  readonly listPrinters: () => Promise<readonly PrinterSummary[]>;
  readonly printHtml: (request: PrintRequest) => Promise<PrintResult>;
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
  platform: process.platform,
};

contextBridge.exposeInMainWorld('vaultBillDesktop', desktopBridge);
