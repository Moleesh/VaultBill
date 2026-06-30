/** @format */

import { BrowserWindow, ipcMain, shell } from 'electron';

import { cancelOutputJob, printHtmlWithElectron } from './PrintBridge.js';
import { renderHtmlToPdf } from './PdfBridge.js';
import { listElectronPrinters } from './PrinterBridge.js';
import { hostedAppUrl, mainState } from './MainState.js';
import { refreshTray } from './MainRuntime.js';
import { getRuntimeProcessInfo } from './RuntimeProcessInfo.js';
import { LocalApiConfigurationSchema } from './server/LocalApiSecurity.js';
import { registerMainIpcBackupHandlers } from './MainIpcBackupHandlers.js';
import { completeSetup } from './SetupSupport.js';

export const registerMainIpcHandlers = () => {
    ipcMain.handle('vaultbill:get-app-identity', () => mainState.identity);
    ipcMain.handle('vaultbill:runtime:process-info', () => getRuntimeProcessInfo());
    ipcMain.handle('vaultbill:hosted-web:url', () => hostedAppUrl());
    ipcMain.handle('vaultbill:hosted-web:open', () => shell.openExternal(hostedAppUrl()));
    ipcMain.handle('vaultbill:window:minimize', () => mainState.mainWindow?.minimize());
    ipcMain.handle('vaultbill:window:close', () => mainState.mainWindow?.hide());

    ipcMain.handle(
        'vaultbill:accounts:list',
        () => mainState.credentialStore?.listAccounts() ?? [],
    );
    ipcMain.handle('vaultbill:accounts:login', (_event, userId: unknown, password: unknown) => {
        if (
            !mainState.credentialStore ||
            typeof userId !== 'string' ||
            typeof password !== 'string'
        ) {
            throw new Error('Desktop credentials are not ready.');
        }
        return mainState.credentialStore.authenticate(userId, password);
    });
    ipcMain.handle('vaultbill:accounts:save', (_event, account: unknown) => {
        if (!mainState.credentialStore) throw new Error('Desktop credentials are not ready.');
        return mainState.credentialStore.saveAccount(account);
    });
    ipcMain.handle('vaultbill:accounts:archive', (_event, userId: unknown) => {
        if (!mainState.credentialStore || typeof userId !== 'string') {
            throw new Error('An account ID is required.');
        }
        mainState.credentialStore.archiveAccount(userId);
    });
    ipcMain.handle(
        'vaultbill:accounts:reset-password',
        (_event, userId: unknown, password: unknown) => {
            if (
                !mainState.credentialStore ||
                typeof userId !== 'string' ||
                typeof password !== 'string'
            ) {
                throw new Error('An account and password are required.');
            }
            return mainState.credentialStore.resetPassword(userId, password);
        },
    );

    ipcMain.handle('vaultbill:credentials:status', () => {
        if (!mainState.credentialStore) throw new Error('Desktop credentials are not ready.');
        return mainState.credentialStore.getCredentialStatus();
    });
    ipcMain.handle('vaultbill:credentials:set-backup-password', (_event, password: unknown) => {
        if (!mainState.credentialStore || typeof password !== 'string') {
            throw new Error('A backup password is required.');
        }
        mainState.credentialStore.setBackupPassword(password);
    });

    ipcMain.handle('vaultbill:setup:sysadmin', (_event, displayName: unknown) => {
        if (!mainState.credentialStore || typeof displayName !== 'string') {
            throw new Error('A display name is required.');
        }
        mainState.credentialStore.configureSysAdmin(displayName);
    });
    ipcMain.handle('vaultbill:setup:complete', (_event, request: unknown) => {
        if (!mainState.credentialStore || !mainState.settingsStore) {
            throw new Error('Setup services are not ready.');
        }
        completeSetup(mainState.credentialStore, mainState.settingsStore, request);
        return {
            credentialStatus: mainState.credentialStore.getCredentialStatus(),
            business: mainState.settingsStore.getBusiness(),
        };
    });

    ipcMain.handle('vaultbill:settings:business:get', () => mainState.settingsStore?.getBusiness());
    ipcMain.handle('vaultbill:settings:business:save', (_event, request: unknown) => {
        if (!mainState.settingsStore) throw new Error('Settings are not ready.');
        return mainState.settingsStore.saveBusiness(request);
    });
    ipcMain.handle('vaultbill:settings:secrets:get', () => mainState.settingsStore?.getSecrets());
    ipcMain.handle('vaultbill:settings:secrets:save', (_event, request: unknown) => {
        if (!mainState.settingsStore) throw new Error('Settings are not ready.');
        return mainState.settingsStore.saveSecrets(request);
    });
    ipcMain.handle('vaultbill:settings:integrations:get', () =>
        mainState.settingsStore?.getIntegrations(),
    );
    ipcMain.handle('vaultbill:settings:integrations:save', (_event, request: unknown) => {
        if (!mainState.settingsStore) throw new Error('Settings are not ready.');
        return mainState.settingsStore.saveIntegrations(request);
    });
    ipcMain.handle('vaultbill:settings:backup:status', () =>
        mainState.settingsStore?.getBackupMetadata(),
    );

    ipcMain.handle('vaultbill:download-pdf', (_event, request: unknown) =>
        renderHtmlToPdf(request),
    );
    ipcMain.handle('vaultbill:print-html', (_event, request: unknown) =>
        printHtmlWithElectron(request),
    );
    ipcMain.handle('vaultbill:output:cancel', (_event, jobId: unknown) => {
        if (typeof jobId !== 'string') throw new Error('A job ID is required.');
        return cancelOutputJob(jobId);
    });
    ipcMain.handle('vaultbill:list-printers', async (event) => {
        const browserWindow = BrowserWindow.fromWebContents(event.sender) ?? mainState.mainWindow;
        if (!browserWindow) throw new Error('A host window is required.');
        return listElectronPrinters(browserWindow);
    });

    ipcMain.handle('vaultbill:records:list', () => mainState.recordStore?.list() ?? []);
    ipcMain.handle('vaultbill:reports:query', (_event, request: unknown) => {
        if (!mainState.recordStore) throw new Error('Records are not ready.');
        return mainState.recordStore.queryReport(request);
    });
    ipcMain.handle('vaultbill:records:save-draft', (_event, request: unknown) => {
        if (!mainState.recordStore) throw new Error('Records are not ready.');
        return mainState.recordStore.saveDraft(request);
    });
    ipcMain.handle('vaultbill:records:finalize', (_event, request: unknown) => {
        if (!mainState.recordStore) throw new Error('Records are not ready.');
        return mainState.recordStore.finalize(request);
    });
    ipcMain.handle('vaultbill:records:cancel', (_event, request: unknown) => {
        if (!mainState.recordStore) throw new Error('Records are not ready.');
        return mainState.recordStore.cancel(request);
    });

    ipcMain.handle('vaultbill:local-api:configure', async (_event, request: unknown) => {
        if (!mainState.localApiServer) throw new Error('Hosted web services are not ready.');
        mainState.hostedWebSettings = LocalApiConfigurationSchema.parse(
            await mainState.localApiServer.configure(request),
        );
        refreshTray();
        return mainState.hostedWebSettings;
    });
    ipcMain.handle('vaultbill:local-api:settings', () => mainState.hostedWebSettings);
    ipcMain.handle('vaultbill:local-api:status', () => ({
        isRunning: mainState.localApiServer?.isHostedAccessEnabled() ?? false,
    }));
    ipcMain.handle('vaultbill:local-api:start', () => {
        if (!mainState.localApiServer) throw new Error('Hosted web services are not ready.');
        mainState.localApiServer.startHostedAccess();
        refreshTray();
        return { isRunning: mainState.localApiServer.isHostedAccessEnabled() };
    });
    ipcMain.handle('vaultbill:local-api:stop', () => {
        if (!mainState.localApiServer) throw new Error('Hosted web services are not ready.');
        mainState.localApiServer.stopHostedAccess();
        refreshTray();
        return { isRunning: mainState.localApiServer.isHostedAccessEnabled() };
    });
    ipcMain.handle('vaultbill:local-api:restart', () => {
        if (!mainState.localApiServer) throw new Error('Hosted web services are not ready.');
        mainState.localApiServer.restartHostedAccess();
        refreshTray();
        return { isRunning: mainState.localApiServer.isHostedAccessEnabled() };
    });
    ipcMain.handle('vaultbill:trial:status', () => mainState.recordStore?.checkpointTrial());
    ipcMain.handle('vaultbill:trial:activate', (_event, licenseKey: unknown) => {
        if (!mainState.recordStore || typeof licenseKey !== 'string') {
            throw new Error('A license key is required.');
        }
        return mainState.recordStore.activateLicense(licenseKey);
    });

    ipcMain.handle('vaultbill:builder:load', (_event, formatId: unknown) =>
        mainState.builderStore?.load(typeof formatId === 'string' ? formatId : undefined),
    );
    ipcMain.handle(
        'vaultbill:builder:inventory',
        () => mainState.builderStore?.listInventory() ?? [],
    );
    ipcMain.handle('vaultbill:builder:save', (_event, builderPackage: unknown) => {
        if (!mainState.builderStore) throw new Error('Builder services are not ready.');
        return mainState.builderStore.save(builderPackage);
    });
    const { createBackup, resetApplication, restoreBackup } = registerMainIpcBackupHandlers();
    ipcMain.handle('vaultbill:backup:create', createBackup);
    ipcMain.handle('vaultbill:backup:restore', restoreBackup);
    ipcMain.handle('vaultbill:application:reset', resetApplication);
};
