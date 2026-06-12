/** @format */

import { BrowserWindow, ipcMain, session } from 'electron';

import { cancelOutputJob, printHtmlWithElectron } from './PrintBridge.js';
import { renderHtmlToPdf } from './PdfBridge.js';
import { listElectronPrinters } from './PrinterBridge.js';
import { mainState } from './MainState.js';
import {
    closeRuntime,
    refreshTray,
    restartApplication,
} from './MainRuntime.js';
import { LocalApiConfigurationSchema } from './server/LocalApiSecurity.js';

export const registerMainIpcHandlers = () => {
    ipcMain.handle('vaultbill:get-app-identity', () => mainState.identity);
    ipcMain.handle('vaultbill:window:minimize', () => mainState.mainWindow?.minimize());
    ipcMain.handle('vaultbill:window:close', () => mainState.mainWindow?.close());

    ipcMain.handle('vaultbill:accounts:list', () => mainState.credentialStore?.listAccounts() ?? []);
    ipcMain.handle('vaultbill:accounts:login', (_event, userId: unknown, password: unknown) => {
        if (!mainState.credentialStore || typeof userId !== 'string' || typeof password !== 'string') {
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
    ipcMain.handle('vaultbill:accounts:reset-password', (_event, userId: unknown, password: unknown) => {
        if (!mainState.credentialStore || typeof userId !== 'string' || typeof password !== 'string') {
            throw new Error('An account and password are required.');
        }
        return mainState.credentialStore.resetPassword(userId, password);
    });

    ipcMain.handle('vaultbill:credentials:status', () => {
        if (!mainState.credentialStore) throw new Error('Desktop credentials are not ready.');
        return mainState.credentialStore.getCredentialStatus();
    });
    ipcMain.handle('vaultbill:credentials:set-backup-password', (_event, password: unknown) => {
        if (!mainState.credentialStore || typeof password !== 'string') {
            throw new Error('A backup password is required.');
        }
        return mainState.credentialStore.setBackupPassword(password);
    });

    ipcMain.handle('vaultbill:setup:sysadmin', (_event, displayName: unknown) => {
        if (!mainState.credentialStore || typeof displayName !== 'string') {
            throw new Error('A display name is required.');
        }
        return mainState.credentialStore.configureSysAdmin(displayName);
    });
    ipcMain.handle('vaultbill:setup:complete', () => {
        if (!mainState.credentialStore || !mainState.settingsStore) {
            throw new Error('Setup services are not ready.');
        }
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
    ipcMain.handle('vaultbill:settings:integrations:get', () => mainState.settingsStore?.getIntegrations());
    ipcMain.handle('vaultbill:settings:integrations:save', (_event, request: unknown) => {
        if (!mainState.settingsStore) throw new Error('Settings are not ready.');
        return mainState.settingsStore.saveIntegrations(request);
    });

    ipcMain.handle('vaultbill:download-pdf', (_event, request: unknown) => renderHtmlToPdf(request));
    ipcMain.handle('vaultbill:print-html', (_event, request: unknown) => printHtmlWithElectron(request));
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
    ipcMain.handle('vaultbill:local-api:settings', () => mainState.settingsStore?.getHostedWeb());
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
    ipcMain.handle('vaultbill:builder:inventory', () => mainState.builderStore?.listInventory() ?? []);
    ipcMain.handle('vaultbill:builder:save', (_event, builderPackage: unknown) => {
        if (!mainState.builderStore) throw new Error('Builder services are not ready.');
        return mainState.builderStore.save(builderPackage);
    });

    ipcMain.handle('vaultbill:backup:create', async (_event, request: unknown) => {
        if (!mainState.backupService || !mainState.credentialStore) {
            throw new Error('Backup services are not ready.');
        }
        const input = request as { encrypted?: unknown; currentPassword?: unknown } | undefined;
        if (typeof input?.currentPassword !== 'string' || typeof input?.encrypted !== 'boolean') {
            throw new Error('A backup request is required.');
        }
        mainState.credentialStore.authenticate('sysadmin_1', input.currentPassword);
        const archive = mainState.backupService.createArchive(
            input.encrypted,
            input.encrypted ? mainState.credentialStore.getBackupPassword() : undefined,
        );
        return {
            ...archive,
            fileName: `vaultbill-backup-${new Date().toISOString().slice(0, 16).replace('T', '-').replaceAll(':', '-')}.zip`,
        };
    });
    ipcMain.handle('vaultbill:backup:restore', async (_event, request: unknown) => {
        if (!mainState.backupService || !mainState.credentialStore) {
            throw new Error('Restore services are not ready.');
        }
        const input = request as { password?: unknown; recoveryKey?: unknown } | undefined;
        const password =
            typeof input?.password === 'string' && input.password.length > 0
                ? input.password
                : mainState.credentialStore.getBackupPassword();
        const recoveryKey =
            typeof input?.recoveryKey === 'string' && input.recoveryKey.length > 0
                ? input.recoveryKey
                : undefined;
        const prepared = await mainState.backupService.prepareRestore(password, recoveryKey);
        if (prepared.cancelled || !prepared.databasePath) return prepared;
        await closeRuntime();
        mainState.backupService.replaceDatabase(prepared.databasePath);
        restartApplication();
        return { cancelled: false, restarting: true };
    });
    ipcMain.handle('vaultbill:application:reset', async (_event, request: unknown) => {
        if (!mainState.backupService || !mainState.credentialStore) {
            throw new Error('Reset services are not ready.');
        }
        const input = request as { password?: unknown; confirmation?: unknown } | undefined;
        if (input?.confirmation !== 'RESET VAULTBILL') {
            throw new Error('Type RESET VAULTBILL to confirm the application reset.');
        }
        if (typeof input?.password !== 'string') throw new Error('The SysAdmin password is required.');
        mainState.credentialStore.authenticate('sysadmin_1', input.password);
        await closeRuntime();
        mainState.backupService.resetDatabase();
        await session.defaultSession.clearStorageData({ storages: ['localstorage'] });
        restartApplication();
        return { restarting: true };
    });
};
