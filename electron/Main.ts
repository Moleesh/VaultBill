/**
 * eslint-disable max-lines
 *
 * @format
 */

/** @format */

/** Electron main process that launches the app shell, tray lifecycle, and host servers. */

import {
    app,
    BrowserWindow,
    dialog,
    ipcMain,
    Menu,
    nativeImage,
    safeStorage,
    session,
    shell,
    Tray,
} from 'electron';
import type { OpenDialogOptions, SaveDialogOptions } from 'electron';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BackupService } from './BackupService.js';
import { getBuildIdentity } from './BuildIdentity.js';
import { BuilderStore } from './BuilderStore.js';
import { CredentialStore } from './CredentialStore.js';
import { renderHtmlToPdf } from './PdfBridge.js';
import { cancelOutputJob, printHtmlWithElectron } from './PrintBridge.js';
import { listElectronPrinters } from './PrinterBridge.js';
import { DesktopRecordStore } from './RecordStore.js';
import { SettingsStore } from './SettingsStore.js';
import { LocalApiServer } from './server/LocalApiServer.js';
import { LocalApiConfigurationSchema } from './server/LocalApiSecurity.js';

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const identity = getBuildIdentity();
const hostedAppUrl = 'http://127.0.0.1:4317';
let recordStore: DesktopRecordStore | undefined;
let credentialStore: CredentialStore | undefined;
let builderStore: BuilderStore | undefined;
let settingsStore: SettingsStore | undefined;
let backupService: BackupService | undefined;
let localApiServer: LocalApiServer | undefined;
let mainWindow: BrowserWindow | undefined;
let tray: Tray | undefined;
let hostedWebSettings = { lanEnabled: false, passwordRequired: true, port: 4317 };
let isQuitting = false;
let trialTimer: NodeJS.Timeout | undefined;
let runtimeClosePromise: Promise<void> | undefined;

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
            {
                label: hostedWebSettings.lanEnabled
                    ? `LAN access: enabled on port ${String(hostedWebSettings.port)}`
                    : 'LAN access: disabled',
                enabled: false,
            },
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

const refreshTray = () => {
    tray?.destroy();
    tray = undefined;
    createTray();
};

const closeRuntime = async () => {
    if (runtimeClosePromise) return runtimeClosePromise;
    runtimeClosePromise = (async () => {
        if (trialTimer) clearInterval(trialTimer);
        trialTimer = undefined;
        const server = localApiServer;
        localApiServer = undefined;
        await server?.stop();
        recordStore?.close();
        recordStore = undefined;
        credentialStore?.close();
        credentialStore = undefined;
        builderStore?.close();
        builderStore = undefined;
        settingsStore?.close();
        settingsStore = undefined;
    })();
    return runtimeClosePromise;
};

const restartApplication = () => {
    setTimeout(() => {
        app.relaunch();
        app.exit(0);
    }, 150);
};

const scheduleRuntimeMutation = (mutation: () => Promise<void> | void) => {
    setTimeout(() => {
        void closeRuntime()
            .then(async () => {
                await mutation();
                restartApplication();
            })
            .catch((error: unknown) => {
                console.error('VaultBill could not complete the requested data operation.', error);
            });
    }, 250);
};

ipcMain.handle('vaultbill:get-app-identity', () => identity);
ipcMain.handle('vaultbill:window:minimize', () => {
    mainWindow?.minimize();
});
ipcMain.handle('vaultbill:window:close', () => {
    mainWindow?.close();
});
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
    if (!credentialStore || typeof userId !== 'string')
        throw new Error('An account ID is required.');
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
ipcMain.handle('vaultbill:credentials:status', () => {
    if (!credentialStore) throw new Error('Desktop credentials are not ready.');
    return credentialStore.getCredentialStatus();
});
ipcMain.handle('vaultbill:credentials:set-backup-password', (_event, password: unknown) => {
    if (!credentialStore || typeof password !== 'string') {
        throw new Error('A backup password is required.');
    }
    credentialStore.setBackupPassword(password);
    return credentialStore.getCredentialStatus();
});
ipcMain.handle('vaultbill:setup:sysadmin', (_event, displayName: unknown) => {
    if (!credentialStore || typeof displayName !== 'string') {
        throw new Error('A System Administrator name is required.');
    }
    credentialStore.configureSysAdmin(displayName);
});
ipcMain.handle('vaultbill:setup:complete', (_event, request: unknown) => {
    if (!credentialStore || !settingsStore) throw new Error('Setup services are not ready.');
    if (typeof request !== 'object' || request === null) throw new Error('Setup data is required.');
    const input = request as {
        companyName?: unknown;
        address?: unknown;
        sysAdminName?: unknown;
    };
    if (
        typeof input.companyName !== 'string' ||
        typeof input.address !== 'string' ||
        typeof input.sysAdminName !== 'string'
    ) {
        throw new Error('Business and System Administrator details are required.');
    }
    credentialStore.configureSysAdmin(input.sysAdminName);
    settingsStore.saveBusiness({
        companyName: input.companyName,
        address: input.address,
        gstin: '',
        theme: 'teal-flow',
        outputTarget: 'PreviewOnly',
    });
});
ipcMain.handle('vaultbill:settings:business:get', () => {
    if (!settingsStore) throw new Error('Settings are not ready.');
    return settingsStore.getBusiness();
});
ipcMain.handle('vaultbill:settings:business:save', (_event, request: unknown) => {
    if (!settingsStore) throw new Error('Settings are not ready.');
    return settingsStore.saveBusiness(request);
});
ipcMain.handle('vaultbill:settings:integrations:get', () => {
    if (!settingsStore) throw new Error('Settings are not ready.');
    return settingsStore.getIntegrations();
});
ipcMain.handle('vaultbill:settings:integrations:save', (_event, request: unknown) => {
    if (!settingsStore || !recordStore) throw new Error('Settings are not ready.');
    if (recordStore.getTrialStatus().isExpired) {
        throw new Error('The trial is read-only. Enter a license key to configure integrations.');
    }
    return settingsStore.saveIntegrations(request);
});
ipcMain.handle('vaultbill:download-pdf', (_event, request: unknown) => renderHtmlToPdf(request));
ipcMain.handle('vaultbill:print-html', (_event, request: unknown) =>
    printHtmlWithElectron(request),
);
ipcMain.handle('vaultbill:output:cancel', (_event, jobId: unknown) => {
    if (typeof jobId !== 'string') throw new Error('An output job ID is required.');
    return cancelOutputJob(jobId);
});
ipcMain.handle('vaultbill:list-printers', async (event) => {
    const senderWindow = BrowserWindow.fromWebContents(event.sender);
    return senderWindow ? listElectronPrinters(senderWindow) : [];
});
ipcMain.handle('vaultbill:records:list', () => recordStore?.list() ?? []);
ipcMain.handle('vaultbill:reports:query', (_event, request: unknown) => {
    if (!recordStore) throw new Error('The desktop record store is not ready.');
    return recordStore.queryReport(request);
});
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
    const configuration = LocalApiConfigurationSchema.parse(request);
    hostedWebSettings = settingsStore?.saveHostedWeb(configuration) ?? configuration;
    const configured = await localApiServer.configure(hostedWebSettings);
    refreshTray();
    return configured;
});
ipcMain.handle('vaultbill:local-api:settings', () => settingsStore?.getHostedWeb());
ipcMain.handle('vaultbill:trial:status', () => recordStore?.checkpointTrial());
ipcMain.handle('vaultbill:trial:activate', (_event, licenseKey: unknown) => {
    if (!recordStore || typeof licenseKey !== 'string')
        throw new Error('A license key is required.');
    return recordStore.activateLicense(licenseKey);
});
ipcMain.handle('vaultbill:builder:load', (_event, formatId: unknown) =>
    builderStore?.load(typeof formatId === 'string' ? formatId : undefined),
);
ipcMain.handle('vaultbill:builder:inventory', () => builderStore?.listInventory() ?? []);
ipcMain.handle('vaultbill:builder:save', (_event, builderPackage: unknown) => {
    if (!builderStore || !recordStore) throw new Error('The Builder store is not ready.');
    if (recordStore.getTrialStatus().isExpired) {
        throw new Error('The trial is read-only. Enter a license key to use Builder.');
    }
    return builderStore.save(builderPackage);
});
ipcMain.handle('vaultbill:backup:create', async (_event, request: unknown) => {
    if (!backupService || !credentialStore || !recordStore) {
        throw new Error('Backup services are not ready.');
    }
    if (recordStore.getTrialStatus().isExpired) {
        throw new Error('The trial is read-only. Enter a license key to create backups.');
    }
    const encrypted =
        typeof request === 'object' &&
        request !== null &&
        'encrypted' in request &&
        request.encrypted === false
            ? false
            : true;
    return backupService.create(
        encrypted,
        encrypted ? credentialStore.getBackupPassword() : undefined,
    );
});
ipcMain.handle('vaultbill:backup:restore', async (_event, request: unknown) => {
    if (!backupService || !credentialStore || !recordStore) {
        throw new Error('Restore services are not ready.');
    }
    if (recordStore.getTrialStatus().isExpired) {
        throw new Error('The trial is read-only. Enter a license key to restore backups.');
    }
    const input =
        typeof request === 'object' && request !== null
            ? (request as { password?: unknown; recoveryKey?: unknown })
            : {};
    const password =
        typeof input.password === 'string' && input.password.length > 0
            ? input.password
            : credentialStore.getBackupPassword();
    const recoveryKey =
        typeof input.recoveryKey === 'string' && input.recoveryKey.length > 0
            ? input.recoveryKey
            : undefined;
    const prepared = await backupService.prepareRestore(password, recoveryKey);
    if (prepared.cancelled || !prepared.databasePath) return prepared;
    await closeRuntime();
    backupService.replaceDatabase(prepared.databasePath);
    restartApplication();
    return { cancelled: false, restarting: true };
});
ipcMain.handle('vaultbill:application:reset', async (_event, request: unknown) => {
    if (!backupService || !credentialStore) throw new Error('Reset services are not ready.');
    const input =
        typeof request === 'object' && request !== null
            ? (request as { password?: unknown; confirmation?: unknown })
            : {};
    if (input.confirmation !== 'RESET VAULTBILL') {
        throw new Error('Type RESET VAULTBILL to confirm the application reset.');
    }
    if (typeof input.password !== 'string') throw new Error('The SysAdmin password is required.');
    credentialStore.authenticate('sysadmin_1', input.password);
    await closeRuntime();
    backupService.resetDatabase();
    await session.defaultSession.clearStorageData({ storages: ['localstorage'] });
    restartApplication();
    return { restarting: true };
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
        builderStore = new BuilderStore(databasePath);
        settingsStore = new SettingsStore(databasePath);
        hostedWebSettings = settingsStore.getHostedWeb();
        backupService = new BackupService(databasePath, {
            chooseBackupDestination: async (defaultFileName) => {
                const options: SaveDialogOptions = {
                    defaultPath: defaultFileName,
                    filters: [{ name: 'VaultBill backup', extensions: ['zip'] }],
                };
                const selection = mainWindow
                    ? await dialog.showSaveDialog(mainWindow, options)
                    : await dialog.showSaveDialog(options);
                return selection.canceled ? undefined : selection.filePath;
            },
            chooseRestoreSource: async () => {
                const options: OpenDialogOptions = {
                    properties: ['openFile'],
                    filters: [{ name: 'VaultBill backup', extensions: ['zip'] }],
                };
                const selection = mainWindow
                    ? await dialog.showOpenDialog(mainWindow, options)
                    : await dialog.showOpenDialog(options);
                return selection.canceled ? undefined : selection.filePaths[0];
            },
        });
        localApiServer = new LocalApiServer(
            recordStore,
            credentialStore,
            builderStore,
            path.join(currentDirectory, '../dist'),
            hostedWebSettings,
            {
                createBackup: (encrypted, sysAdminPassword) => {
                    if (!credentialStore || !backupService) {
                        throw new Error('Backup services are not ready.');
                    }
                    credentialStore.authenticate('sysadmin_1', sysAdminPassword);
                    const archive = backupService.createArchive(
                        encrypted,
                        encrypted ? credentialStore.getBackupPassword() : undefined,
                    );
                    const timestamp = new Date()
                        .toISOString()
                        .slice(0, 16)
                        .replace('T', '-')
                        .replaceAll(':', '-');
                    return {
                        ...archive,
                        fileName: `vaultbill-backup-${timestamp}.zip`,
                    };
                },
                restoreBackup: (bytes, sysAdminPassword, backupPassword, recoveryKey) => {
                    if (!credentialStore || !backupService) {
                        throw new Error('Restore services are not ready.');
                    }
                    credentialStore.authenticate('sysadmin_1', sysAdminPassword);
                    const preparedPath = backupService.prepareRestoreArchive(
                        bytes,
                        backupPassword?.length
                            ? backupPassword
                            : credentialStore.getBackupPassword(),
                        recoveryKey,
                    );
                    scheduleRuntimeMutation(() => backupService?.replaceDatabase(preparedPath));
                },
                resetApplicationData: (sysAdminPassword, confirmation) => {
                    if (!credentialStore || !backupService) {
                        throw new Error('Reset services are not ready.');
                    }
                    if (confirmation !== 'RESET VAULTBILL') {
                        throw new Error('Type RESET VAULTBILL to confirm the application reset.');
                    }
                    credentialStore.authenticate('sysadmin_1', sysAdminPassword);
                    scheduleRuntimeMutation(async () => {
                        backupService?.resetDatabase();
                        await session.defaultSession.clearStorageData({
                            storages: ['localstorage'],
                        });
                    });
                },
                getCredentialStatus: () => {
                    if (!credentialStore) throw new Error('Desktop credentials are not ready.');
                    return credentialStore.getCredentialStatus();
                },
                setBackupPassword: (sysAdminPassword, backupPassword) => {
                    if (!credentialStore) throw new Error('Desktop credentials are not ready.');
                    credentialStore.authenticate('sysadmin_1', sysAdminPassword);
                    credentialStore.setBackupPassword(backupPassword);
                    return credentialStore.getCredentialStatus();
                },
                getBusinessSettings: () => {
                    if (!settingsStore) throw new Error('Settings are not ready.');
                    return settingsStore.getBusiness();
                },
                saveBusinessSettings: (input) => {
                    if (!settingsStore) throw new Error('Settings are not ready.');
                    return settingsStore.saveBusiness(input);
                },
                getIntegrationSettings: () => {
                    if (!settingsStore) throw new Error('Settings are not ready.');
                    return settingsStore.getIntegrations();
                },
                saveIntegrationSettings: (input) => {
                    if (!settingsStore) throw new Error('Settings are not ready.');
                    return settingsStore.saveIntegrations(input);
                },
                printHtml: (input) => printHtmlWithElectron(input),
                cancelPrint: (jobId) => cancelOutputJob(jobId),
            },
        );
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
    void closeRuntime();
    tray?.destroy();
});

app.on('window-all-closed', () => {
    // VaultBill stays alive in the tray so the local web application remains available.
});
