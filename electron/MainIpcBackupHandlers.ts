/** @format */

import { session } from 'electron';

import { closeRuntime, restartApplication } from './MainRuntime.js';
import { mainState } from './MainState.js';

/**
 * Registers the backup, restore, and application reset IPC handlers.
 */
export const registerMainIpcBackupHandlers = () => {
    const createBackupFileName = () =>
        `vaultbill-backup-${new Date().toISOString().slice(0, 16).replace('T', '-').replaceAll(':', '-')}.zip`;

    const createBackup = (_event: unknown, request: unknown) => {
        if (!mainState.backupService || !mainState.credentialStore) {
            throw new Error('Backup services are not ready.');
        }
        const input = request as { encrypted?: unknown; currentPassword?: unknown } | undefined;
        if (
            !input ||
            typeof input.currentPassword !== 'string' ||
            typeof input.encrypted !== 'boolean'
        ) {
            throw new Error('A backup request is required.');
        }
        mainState.credentialStore.authenticate('sysadmin_1', input.currentPassword);
        const archive = mainState.backupService.createArchive(
            input.encrypted,
            input.encrypted ? mainState.credentialStore.getBackupPassword() : undefined,
        );
        return { ...archive, fileName: createBackupFileName() };
    };

    const restoreBackup = async (_event: unknown, request: unknown) => {
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
    };

    const resetApplication = async (_event: unknown, request: unknown) => {
        if (!mainState.backupService || !mainState.credentialStore) {
            throw new Error('Reset services are not ready.');
        }
        if (typeof request !== 'object' || request === null) {
            throw new Error('Type RESET VAULTBILL to confirm the application reset.');
        }
        const input = request as { password?: unknown; confirmation?: unknown };
        if (input.confirmation !== 'RESET VAULTBILL') {
            throw new Error('Type RESET VAULTBILL to confirm the application reset.');
        }
        if (typeof input.password !== 'string') {
            throw new Error('The SysAdmin password is required.');
        }
        mainState.credentialStore.authenticate('sysadmin_1', input.password);
        await closeRuntime();
        mainState.backupService.resetDatabase();
        await session.defaultSession.clearStorageData({ storages: ['localstorage'] });
        restartApplication();
        return { restarting: true };
    };

    return { createBackup, resetApplication, restoreBackup };
};
