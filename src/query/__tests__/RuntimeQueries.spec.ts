/** @format */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    createRuntimeBackup,
    fetchSessionSnapshot,
    resetRuntimeApplicationData,
    restoreRuntimeBackup,
    updateRuntimeBackupPassword,
} from '../RuntimeQueries';

const hostedAdminAccount = {
    userId: 'admin_1',
    username: 'admin',
    displayName: 'Operations Admin',
    role: 'Admin',
    isActive: true,
    passwordConfigured: true,
    usesDefaultPassword: false,
} as const;

describe('RuntimeQueries', () => {
    beforeEach(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
        vi.unstubAllGlobals();
    });

    afterEach(() => {
        delete (window as Partial<Window> & { vaultBillDesktop?: unknown }).vaultBillDesktop;
    });

    it('restores the active desktop operator from local storage during refresh', async () => {
        const adminAccount = {
            userId: 'admin_1',
            username: 'admin',
            displayName: 'Operations Admin',
            role: 'Admin',
            isActive: true,
            passwordConfigured: true,
            usesDefaultPassword: false,
        } as const;

        window.localStorage.setItem('vaultbill.operator', adminAccount.userId);
        Object.defineProperty(window, 'vaultBillDesktop', {
            configurable: true,
            value: {
                listAccounts: vi.fn().mockResolvedValue([adminAccount]),
            } as const,
        });

        await expect(
            fetchSessionSnapshot({
                canUseHostedSessionApi: false,
                usesStaticHostedBrowserBuild: false,
            }),
        ).resolves.toMatchObject({
            accounts: [adminAccount],
            account: adminAccount,
            csrfToken: undefined,
        });
    });

    it('reads the hosted session snapshot through one hosted request', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(
                JSON.stringify({
                    accounts: [hostedAdminAccount],
                    account: hostedAdminAccount,
                    csrfToken: 'csrf-token',
                }),
                {
                    status: 200,
                    headers: { 'content-type': 'application/json' },
                },
            ),
        );
        vi.stubGlobal('fetch', fetchMock);
        Object.defineProperty(window, 'fetch', {
            configurable: true,
            value: fetchMock,
        });

        await expect(
            fetchSessionSnapshot({
                canUseHostedSessionApi: true,
                usesStaticHostedBrowserBuild: false,
            }),
        ).resolves.toMatchObject({
            accounts: [hostedAdminAccount],
            account: hostedAdminAccount,
            csrfToken: 'csrf-token',
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/auth/snapshot'),
            expect.objectContaining({
                credentials: 'include',
                method: 'GET',
            }),
        );
    });

    it('routes backup maintenance flows through the desktop bridge when available', async () => {
        const setBackupPassword = vi.fn().mockResolvedValue(undefined);
        const createBackup = vi.fn().mockResolvedValue({
            cancelled: false,
            filePath: 'C:/backups/vaultbill.zip',
            recoveryKey: 'recovery-key',
        });
        const restoreBackup = vi.fn().mockResolvedValue(undefined);
        const resetApplicationData = vi.fn().mockResolvedValue(undefined);

        Object.defineProperty(window, 'vaultBillDesktop', {
            configurable: true,
            value: {
                createBackup,
                listAccounts: vi.fn().mockResolvedValue([]),
                resetApplicationData,
                restoreBackup,
                setBackupPassword,
            } as const,
        });

        await updateRuntimeBackupPassword({
            backupPassword: 'backup-secret',
            capabilities: { isHostedWeb: false },
        });

        await expect(
            createRuntimeBackup({
                capabilities: { isHostedWeb: false },
                encryptBackup: true,
            }),
        ).resolves.toMatchObject({
            success: true,
            filePath: 'C:/backups/vaultbill.zip',
            recoveryKey: 'recovery-key',
        });

        const restoreFile = new File(['backup-bytes'], 'vaultbill.zip', {
            type: 'application/zip',
        });
        await restoreRuntimeBackup({
            capabilities: { isHostedWeb: false },
            restoreFile,
            restorePassword: 'restore-secret',
            restoreRecoveryKey: 'restore-key',
        });

        await resetRuntimeApplicationData({
            capabilities: { isHostedWeb: false },
            resetConfirmation: 'RESET VAULTBILL',
            resetSysAdminPassword: 'sysadmin-password',
        });

        expect(setBackupPassword).toHaveBeenCalledWith('backup-secret');
        expect(createBackup).toHaveBeenCalledWith({ encrypted: true });
        expect(restoreBackup).toHaveBeenCalledWith({
            password: 'restore-secret',
            recoveryKey: 'restore-key',
        });
        expect(resetApplicationData).toHaveBeenCalledWith({
            confirmation: 'RESET VAULTBILL',
            password: 'sysadmin-password',
        });
    });
});
