import { app, BrowserWindow, ipcMain, Menu, nativeImage, safeStorage, shell, Tray } from 'electron';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getBuildIdentity } from './BuildIdentity.js';
import { CredentialStore } from './CredentialStore.js';
import { renderHtmlToPdf } from './PdfBridge.js';
import { printHtmlWithElectron } from './PrintBridge.js';
import { listElectronPrinters } from './PrinterBridge.js';
import { DesktopRecordStore } from './RecordStore.js';
import { LocalApiServer } from './server/LocalApiServer.js';
import { LocalApiConfigurationSchema } from './server/LocalApiSecurity.js';

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const identity = getBuildIdentity();
const hostedAppUrl = 'http://127.0.0.1:4317';
let recordStore: DesktopRecordStore | undefined;
let credentialStore: CredentialStore | undefined;
let localApiServer: LocalApiServer | undefined;
let mainWindow: BrowserWindow | undefined;
let tray: Tray | undefined;
let isQuitting = false;
let trialTimer: NodeJS.Timeout | undefined;

const readLicenseVerifier = (): string => {
  try {
    const packageJson = JSON.parse(
      readFileSync(path.join(app.getAppPath(), 'package.json'), 'utf8'),
    ) as { vaultBillLicenseVerifier?: string };
    return packageJson.vaultBillLicenseVerifier ?? '';
  } catch {
    return '';
  }
};

const createWindow = async () => {
  app.setName(identity.appName);
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 320,
    minHeight: 568,
    title: identity.appName,
    frame: false,
    fullscreen: true,
    autoHideMenuBar: true,
    backgroundColor: '#edf8f5',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(currentDirectory, 'Preload.js'),
      sandbox: true,
    },
  });
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowedOrigin = process.env.VITE_DEV_SERVER_URL
      ? new URL(process.env.VITE_DEV_SERVER_URL).origin
      : new URL(hostedAppUrl).origin;
    if (!url.startsWith(allowedOrigin)) event.preventDefault();
  });
  if (process.env.VITE_DEV_SERVER_URL) await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  else await mainWindow.loadURL(hostedAppUrl);
};

const createTray = () => {
  const icon = nativeImage.createFromPath(path.join(currentDirectory, '../build/icon.png'));
  tray = new Tray(icon);
  tray.setToolTip('VaultBill is hosting the local workspace');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: 'Open VaultBill',
        click: () => {
          mainWindow?.show();
          mainWindow?.focus();
        },
      },
      { label: `Hosted web: ${hostedAppUrl}`, enabled: false },
      { type: 'separator' },
      {
        label: 'Quit VaultBill',
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]),
  );
  tray.on('double-click', () => mainWindow?.show());
};

ipcMain.handle('vaultbill:get-app-identity', () => identity);
ipcMain.handle('vaultbill:accounts:list', () => credentialStore?.listAccounts() ?? []);
ipcMain.handle('vaultbill:accounts:login', (_event, userId: unknown, password: unknown) => {
  if (!credentialStore || typeof userId !== 'string' || typeof password !== 'string') {
    throw new Error('Desktop credentials are not ready.');
  }
  return credentialStore.authenticate(userId, password);
});
ipcMain.handle('vaultbill:accounts:save', (_event, account: unknown) => {
  if (!credentialStore) throw new Error('Desktop credentials are not ready.');
  return credentialStore.saveAccount(account);
});
ipcMain.handle('vaultbill:accounts:archive', (_event, userId: unknown) => {
  if (!credentialStore || typeof userId !== 'string') throw new Error('An account ID is required.');
  credentialStore.archiveAccount(userId);
});
ipcMain.handle(
  'vaultbill:accounts:reset-password',
  (_event, userId: unknown, password: unknown) => {
    if (!credentialStore || typeof userId !== 'string' || typeof password !== 'string') {
      throw new Error('An account and password are required.');
    }
    return credentialStore.resetPassword(userId, password);
  },
);
ipcMain.handle('vaultbill:setup:sysadmin', (_event, displayName: unknown) => {
  if (!credentialStore || typeof displayName !== 'string') {
    throw new Error('A System Administrator name is required.');
  }
  credentialStore.configureSysAdmin(displayName);
});
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
  if (recordStore.getTrialStatus().isExpired)
    throw new Error('The trial is read-only. Enter a license key to save records.');
  return recordStore.saveDraft(request);
});
ipcMain.handle('vaultbill:records:finalize', (_event, request: unknown) => {
  if (!recordStore) throw new Error('The desktop record store is not ready.');
  if (recordStore.getTrialStatus().isExpired)
    throw new Error('The trial is read-only. Enter a license key to finalize records.');
  return recordStore.finalize(request);
});
ipcMain.handle('vaultbill:records:cancel', (_event, request: unknown) => {
  if (!recordStore) throw new Error('The desktop record store is not ready.');
  if (recordStore.getTrialStatus().isExpired) throw new Error('The trial is read-only.');
  return recordStore.cancel(request);
});
ipcMain.handle('vaultbill:local-api:configure', async (_event, request: unknown) => {
  if (!localApiServer) throw new Error('The Local API is not ready.');
  return localApiServer.configure(LocalApiConfigurationSchema.parse(request));
});
ipcMain.handle('vaultbill:trial:status', () => recordStore?.checkpointTrial());
ipcMain.handle('vaultbill:trial:activate', (_event, licenseKey: unknown) => {
  if (!recordStore || typeof licenseKey !== 'string') throw new Error('A license key is required.');
  return recordStore.activateLicense(licenseKey);
});

void app
  .whenReady()
  .then(async () => {
    Menu.setApplicationMenu(null);
    const databasePath = path.join(app.getPath('userData'), 'vaultbill.sqlite');
    recordStore = new DesktopRecordStore(databasePath, readLicenseVerifier());
    credentialStore = new CredentialStore(databasePath, {
      encryptString: (value) => safeStorage.encryptString(value),
      decryptString: (value) => safeStorage.decryptString(value),
    });
    localApiServer = new LocalApiServer(recordStore, path.join(currentDirectory, '../dist'));
    await localApiServer.start();
    await createWindow();
    createTray();
    trialTimer = setInterval(() => recordStore?.checkpointTrial(), 60_000);
    app.on('activate', () => {
      if (!mainWindow) void createWindow();
      else mainWindow.show();
    });
  })
  .catch((error: unknown) => {
    console.error('VaultBill failed to start.', error);
    isQuitting = true;
    app.quit();
  });

app.on('before-quit', () => {
  isQuitting = true;
  if (trialTimer) clearInterval(trialTimer);
  void localApiServer?.stop();
  recordStore?.close();
  credentialStore?.close();
  tray?.destroy();
});

app.on('window-all-closed', () => {
  // VaultBill stays alive in the tray so the local web application remains available.
});
