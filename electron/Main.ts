/** @format */

/**
 * Electron entry point that boots the desktop runtime, local API, and hosted
 * web workspace.
 */

import { app, dialog, Menu, safeStorage, session } from 'electron';
import type { OpenDialogOptions, SaveDialogOptions } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BackupService } from './BackupService.js';
import { getBuildIdentity } from './BuildIdentity.js';
import { BuilderStore } from './BuilderStore.js';
import { CredentialStore } from './CredentialStore.js';
import { DesktopRecordStore } from './RecordStore.js';
import { SettingsStore } from './SettingsStore.js';
import { LocalApiServer } from './server/LocalApiServer.js';
import { registerMainIpcHandlers } from './MainIpc.js';
import {
    closeRuntime,
    createTray,
    createWindow,
    readLicenseVerifier,
    scheduleRuntimeMutation,
} from './MainRuntime.js';
import { mainState } from './MainState.js';
import { printHtmlWithElectron } from './PrintBridge.js';
import { cancelOutputJob } from './PrintBridge.js';

mainState.currentDirectory = path.dirname(fileURLToPath(import.meta.url));
mainState.identity = getBuildIdentity();

const createBackupHandlers = () => ({
    createBackup: (encrypted: boolean, sysAdminPassword: string) => {
        if (!mainState.credentialStore || !mainState.backupService) {
            throw new Error('Backup services are not ready.');
        }
        mainState.credentialStore.authenticate('sysadmin_1', sysAdminPassword);
        const archive = mainState.backupService.createArchive(
            encrypted,
            encrypted ? mainState.credentialStore.getBackupPassword() : undefined,
        );
        mainState.settingsStore?.saveBackupMetadata({
            lastBackupAt: new Date().toISOString(),
        });
        const timestamp = new Date()
            .toISOString()
            .slice(0, 16)
            .replace('T', '-')
            .replaceAll(':', '-');
        return { ...archive, fileName: `vaultbill-backup-${timestamp}.zip` };
    },
    restoreBackup: (
        bytes: Uint8Array,
        sysAdminPassword: string,
        backupPassword?: string,
        recoveryKey?: string,
    ) => {
        if (!mainState.credentialStore || !mainState.backupService) {
            throw new Error('Restore services are not ready.');
        }
        mainState.credentialStore.authenticate('sysadmin_1', sysAdminPassword);
        const preparedPath = mainState.backupService.prepareRestoreArchive(
            bytes,
            backupPassword?.length ? backupPassword : mainState.credentialStore.getBackupPassword(),
            recoveryKey,
        );
        scheduleRuntimeMutation(() => mainState.backupService?.replaceDatabase(preparedPath));
    },
    resetApplicationData: (sysAdminPassword: string, confirmation: string) => {
        if (!mainState.credentialStore || !mainState.backupService) {
            throw new Error('Reset services are not ready.');
        }
        if (confirmation !== 'RESET VAULTBILL') {
            throw new Error('Type RESET VAULTBILL to confirm the application reset.');
        }
        mainState.credentialStore.authenticate('sysadmin_1', sysAdminPassword);
        scheduleRuntimeMutation(async () => {
            mainState.backupService?.resetDatabase();
            await session.defaultSession.clearStorageData({ storages: ['localstorage'] });
        });
    },
    getCredentialStatus: () => {
        if (!mainState.credentialStore) throw new Error('Desktop credentials are not ready.');
        return mainState.credentialStore.getCredentialStatus();
    },
    setBackupPassword: (sysAdminPassword: string, backupPassword: string) => {
        if (!mainState.credentialStore) throw new Error('Desktop credentials are not ready.');
        mainState.credentialStore.authenticate('sysadmin_1', sysAdminPassword);
        mainState.credentialStore.setBackupPassword(backupPassword);
        return mainState.credentialStore.getCredentialStatus();
    },
    getBusinessSettings: () => {
        if (!mainState.settingsStore) throw new Error('Settings are not ready.');
        return mainState.settingsStore.getBusiness();
    },
    saveBusinessSettings: (input: unknown) => {
        if (!mainState.settingsStore) throw new Error('Settings are not ready.');
        return mainState.settingsStore.saveBusiness(input);
    },
    getSecretsSettings: () => {
        if (!mainState.settingsStore) throw new Error('Settings are not ready.');
        return mainState.settingsStore.getSecrets();
    },
    saveSecretsSettings: (input: unknown) => {
        if (!mainState.settingsStore) throw new Error('Settings are not ready.');
        return mainState.settingsStore.saveSecrets(input);
    },
    getIntegrationSettings: () => {
        if (!mainState.settingsStore) throw new Error('Settings are not ready.');
        return mainState.settingsStore.getIntegrations();
    },
    saveIntegrationSettings: (input: unknown) => {
        if (!mainState.settingsStore) throw new Error('Settings are not ready.');
        return mainState.settingsStore.saveIntegrations(input);
    },
    printHtml: (input: unknown) => printHtmlWithElectron(input),
    cancelPrint: (jobId: string) => cancelOutputJob(jobId),
});

void app
    .whenReady()
    .then(async () => {
        Menu.setApplicationMenu(null);
        const databasePath = path.join(app.getPath('userData'), 'vaultbill.sqlite');
        mainState.recordStore = new DesktopRecordStore(databasePath, readLicenseVerifier());
        mainState.credentialStore = new CredentialStore(databasePath, {
            encryptString: (value: string) => safeStorage.encryptString(value),
            decryptString: (value: Buffer) => safeStorage.decryptString(value),
        });
        mainState.builderStore = new BuilderStore(databasePath);
        mainState.settingsStore = new SettingsStore(databasePath);
        mainState.hostedWebSettings = mainState.settingsStore.getHostedWeb();
        mainState.backupService = new BackupService(databasePath, {
            chooseBackupDestination: async (defaultFileName) => {
                const options: SaveDialogOptions = {
                    defaultPath: defaultFileName,
                    filters: [{ name: 'VaultBill backup', extensions: ['zip'] }],
                };
                const selection = mainState.mainWindow
                    ? await dialog.showSaveDialog(mainState.mainWindow, options)
                    : await dialog.showSaveDialog(options);
                return selection.canceled ? undefined : selection.filePath;
            },
            chooseRestoreSource: async () => {
                const options: OpenDialogOptions = {
                    properties: ['openFile'],
                    filters: [{ name: 'VaultBill backup', extensions: ['zip'] }],
                };
                const selection = mainState.mainWindow
                    ? await dialog.showOpenDialog(mainState.mainWindow, options)
                    : await dialog.showOpenDialog(options);
                return selection.canceled ? undefined : selection.filePaths[0];
            },
        });
        mainState.localApiServer = new LocalApiServer(
            mainState.recordStore,
            mainState.credentialStore,
            mainState.builderStore,
            mainState.settingsStore,
            path.join(mainState.currentDirectory, '../dist'),
            mainState.hostedWebSettings,
            createBackupHandlers(),
        );
        registerMainIpcHandlers();
        await mainState.localApiServer.start();
        await createWindow();
        createTray();
        mainState.trialTimer = setInterval(() => mainState.recordStore?.checkpointTrial(), 60_000);
        app.on('activate', () => {
            if (!mainState.mainWindow) void createWindow();
            else mainState.mainWindow.show();
        });
    })
    .catch((error: unknown) => {
        console.error('VaultBill failed to start.', error);
        mainState.isQuitting = true;
        app.quit();
    });

app.on('before-quit', () => {
    mainState.isQuitting = true;
    void closeRuntime();
    mainState.tray?.destroy();
});

app.on('window-all-closed', () => {
    // VaultBill stays alive in the tray so the local web application remains available.
});
