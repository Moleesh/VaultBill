/** @format */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const hostedApiMocks = vi.hoisted(() => ({
    createHostedBackup: vi.fn(),
    requestHostedApi: vi.fn(),
    restoreHostedBackup: vi.fn(),
}));

vi.mock('../../runtime/HostedApi', async () => {
    const actual = await vi.importActual('../../runtime/HostedApi');
    return {
        ...actual,
        createHostedBackup: hostedApiMocks.createHostedBackup,
        requestHostedApi: hostedApiMocks.requestHostedApi,
        restoreHostedBackup: hostedApiMocks.restoreHostedBackup,
    };
});

import {
    createRuntimeBackup,
    resetRuntimeApplicationData,
    restoreRuntimeBackup,
    updateRuntimeBackupPassword,
} from '../RuntimeQueries';

describe('RuntimeQueries hosted backup maintenance', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('routes hosted backup and reset maintenance through shared hosted helpers', async () => {
        hostedApiMocks.createHostedBackup.mockResolvedValue({
            blob: new Blob(['backup']),
            fileName: 'vaultbill-backup.zip',
            recoveryKey: 'restore-key',
        });
        hostedApiMocks.restoreHostedBackup.mockResolvedValue(undefined);
        hostedApiMocks.requestHostedApi.mockResolvedValue(undefined);

        await updateRuntimeBackupPassword({
            backupPassword: 'backup-secret',
            capabilities: { isHostedWeb: true },
            remoteAuthorizationPassword: 'sysadmin-secret',
        });

        await expect(
            createRuntimeBackup({
                capabilities: { isHostedWeb: true },
                encryptBackup: true,
                remoteAuthorizationPassword: 'sysadmin-secret',
            }),
        ).resolves.toMatchObject({
            success: true,
            filePath: 'vaultbill-backup.zip',
            downloadFileName: 'vaultbill-backup.zip',
            recoveryKey: 'restore-key',
        });

        const backupFile = new File(['backup'], 'vaultbill-backup.zip', {
            type: 'application/zip',
        });
        await restoreRuntimeBackup({
            capabilities: { isHostedWeb: true },
            remoteAuthorizationPassword: 'sysadmin-secret',
            restoreFile: backupFile,
            restorePassword: 'restore-secret',
            restoreRecoveryKey: 'restore-key',
        });

        await resetRuntimeApplicationData({
            capabilities: { isHostedWeb: true },
            resetConfirmation: 'RESET VAULTBILL',
            resetSysAdminPassword: 'sysadmin-secret',
        });

        expect(hostedApiMocks.requestHostedApi).toHaveBeenCalledWith(
            '/credentials/backup-password',
            'POST',
            {
                currentPassword: 'sysadmin-secret',
                backupPassword: 'backup-secret',
            },
        );
        expect(hostedApiMocks.createHostedBackup).toHaveBeenCalledWith(true, 'sysadmin-secret');
        expect(hostedApiMocks.restoreHostedBackup).toHaveBeenCalledWith(backupFile, {
            backupPassword: 'restore-secret',
            recoveryKey: 'restore-key',
            sysAdminPassword: 'sysadmin-secret',
        });
        expect(hostedApiMocks.requestHostedApi).toHaveBeenCalledWith('/application/reset', 'POST', {
            currentPassword: 'sysadmin-secret',
            confirmation: 'RESET VAULTBILL',
        });
    });
});
