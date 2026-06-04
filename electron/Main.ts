import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getBuildIdentity } from './BuildIdentity.js';
import { renderHtmlToPdf } from './PdfBridge.js';
import { printHtmlWithElectron } from './PrintBridge.js';
import { listElectronPrinters } from './PrinterBridge.js';

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const identity = getBuildIdentity();

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
      sandbox: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    return;
  }

  await mainWindow.loadFile(path.join(currentDirectory, '../dist/index.html'));
};

ipcMain.handle('vaultbill:get-app-identity', () => identity);
ipcMain.handle('vaultbill:download-pdf', (_event, request: unknown) =>
  renderHtmlToPdf(request),
);
ipcMain.handle('vaultbill:print-html', (_event, request: unknown) =>
  printHtmlWithElectron(request),
);
ipcMain.handle('vaultbill:list-printers', async (event) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  return senderWindow ? listElectronPrinters(senderWindow) : [];
});

void app
  .whenReady()
  .then(() => {
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
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
