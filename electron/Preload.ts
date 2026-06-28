/** @format */

import { contextBridge, ipcRenderer } from 'electron';

import { createDesktopBridge } from './DesktopBridge.js';
export type { VaultBillDesktopBridge } from './DesktopBridgeTypes.js';

contextBridge.exposeInMainWorld('vaultBillRuntime', 'desktop');
contextBridge.exposeInMainWorld('vaultBillDesktop', createDesktopBridge(ipcRenderer));
