import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getBuildIdentity } from './BuildIdentity.js';
import { renderHtmlToPdf } from './PdfBridge.js';
import { printHtmlWithElectron } from './PrintBridge.js';
import { listElectronPrinters } from './PrinterBridge.js';
import { DesktopRecordStore } from './RecordStore.js';
import { LocalApiServer } from './server/LocalApiServer.js';
import { LocalApiConfigurationSchema } from './server/LocalApiSecurity.js';

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const identity = getBuildIdentity();
let recordStore: DesktopRecordStore | undefined;
let localApiServer: LocalApiServer | undefined;

const createWindow = async () => {
  app.setName(identity.appName);

  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 320,
    minHeight: 568,
    title: identity.appName,
    backgroundColor: '#edf8f5',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(currentDirectory, 'Preload.js'),
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowedOrigin = process.env.VITE_DEV_SERVER_URL
      ? new URL(process.env.VITE_DEV_SERVER_URL).origin
      : 'file://';
    if (!url.startsWith(allowedOrigin)) event.preventDefault();
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    return;
  }

  await mainWindow.loadFile(path.join(currentDirectory, '../dist/index.html'));
};

ipcMain.handle('vaultbill:get-app-identity', () => identity);
ipcMain.handle('vaultbill:download-pdf', (_event, request: unknown) => renderHtmlToPdf(request));
ipcMain.handle('vaultbill:print-html', (_event, request: unknown) =>
  printHtmlWithElectron(request),
);
ipcMain.handle('vaultbill:list-printers', async (event) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  return senderWindow ? listElectronPrinters(senderWindow) : [];
});
ipcMain.handle('vaultbill:records:list', () => recordStore?.list() ?? []);
ipcMain.handle('vaultbill:records:save-draft', (_event, request: unknown) => {
  if (!recordStore) throw new Error('The desktop record store is not ready.');
  return recordStore.saveDraft(request);
});
ipcMain.handle('vaultbill:records:finalize', (_event, request: unknown) => {
  if (!recordStore) throw new Error('The desktop record store is not ready.');
  return recordStore.finalize(request);
});
ipcMain.handle('vaultbill:records:cancel', (_event, request: unknown) => {
  if (!recordStore) throw new Error('The desktop record store is not ready.');
  return recordStore.cancel(request);
});
ipcMain.handle('vaultbill:local-api:configure', async (_event, request: unknown) => {
  if (!localApiServer) throw new Error('The Local API is not ready.');
  return localApiServer.configure(LocalApiConfigurationSchema.parse(request));
});

void app
  .whenReady()
  .then(() => {
    recordStore = new DesktopRecordStore(path.join(app.getPath('userData'), 'vaultbill.sqlite'));
    localApiServer = new LocalApiServer(recordStore, path.join(currentDirectory, '../dist'));
    void localApiServer.start();
    void createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        void createWindow();
      }
    });
  })
  .catch((error: unknown) => {
    console.error('VaultBill failed to start.', error);
    app.quit();
  });

app.on('window-all-closed', () => {
  void localApiServer?.stop();
  localApiServer = undefined;
  recordStore?.close();
  recordStore = undefined;
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
