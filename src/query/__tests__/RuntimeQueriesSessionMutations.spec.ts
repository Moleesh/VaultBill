/** @format */
/* eslint-disable max-lines */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultPasswordHash, hashPassword } from '../../features/auth/SessionSupport';
import {
    archiveRuntimeAccount,
    loginRuntimeSession,
    logoutRuntimeSession,
    resetRuntimeAccountPassword,
    saveRuntimeAccount,
} from '../RuntimeQueries';

const localSetupAccountsStorageKey = 'vaultbill.local-setup-accounts';

const hostedAdminAccount = {
    userId: 'admin_1',
    username: 'admin',
    displayName: 'Operations Admin',
    role: 'Admin',
    isActive: true,
    passwordConfigured: true,
    usesDefaultPassword: false,
} as const;

describe('RuntimeQueries session mutations', () => {
    beforeEach(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
        vi.unstubAllGlobals();
    });

    afterEach(() => {
        delete (window as Partial<Window> & { vaultBillDesktop?: unknown }).vaultBillDesktop;
    });

    it('logs in through the desktop bridge when desktop runtime is available', async () => {
        const desktopAccount = {
            ...hostedAdminAccount,
            displayName: 'Desktop Admin',
        } as const;
        const loginAccount = vi.fn().mockResolvedValue(desktopAccount);
        Object.defineProperty(window, 'vaultBillDesktop', {
            configurable: true,
            value: {
                listAccounts: vi.fn().mockResolvedValue([desktopAccount]),
                loginAccount,
            } as const,
        });

        await expect(
            loginRuntimeSession({
                accounts: [hostedAdminAccount],
                canUseHostedSessionApi: false,
                password: 'secret',
                userId: hostedAdminAccount.userId,
            }),
        ).resolves.toEqual({
            account: desktopAccount,
            csrfToken: undefined,
        });

        expect(loginAccount).toHaveBeenCalledWith(hostedAdminAccount.userId, 'secret');
    });

    it('logs in through the hosted auth endpoint when hosted runtime is available', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(
                JSON.stringify({
                    account: hostedAdminAccount,
                    csrfToken: 'csrf-login',
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
            loginRuntimeSession({
                accounts: [hostedAdminAccount],
                canUseHostedSessionApi: true,
                password: 'hosted-secret',
                userId: hostedAdminAccount.userId,
            }),
        ).resolves.toEqual({
            account: hostedAdminAccount,
            csrfToken: 'csrf-login',
        });

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/auth/login'),
            expect.objectContaining({
                method: 'POST',
                credentials: 'include',
            }),
        );
    });

    it('validates browser fallback passwords before allowing login', async () => {
        const browserAccount = {
            ...hostedAdminAccount,
            passwordHash: await hashPassword('correct-password'),
        };

        await expect(
            loginRuntimeSession({
                accounts: [browserAccount],
                canUseHostedSessionApi: false,
                password: 'wrong-password',
                userId: browserAccount.userId,
            }),
        ).rejects.toThrow('The password is incorrect.');

        await expect(
            loginRuntimeSession({
                accounts: [browserAccount],
                canUseHostedSessionApi: false,
                password: 'correct-password',
                userId: browserAccount.userId,
            }),
        ).resolves.toEqual({
            account: browserAccount,
            csrfToken: undefined,
        });
    });

    it('routes hosted logout through the auth endpoint', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(undefined, {
                status: 200,
                headers: { 'content-type': 'application/json' },
            }),
        );
        vi.stubGlobal('fetch', fetchMock);
        Object.defineProperty(window, 'fetch', {
            configurable: true,
            value: fetchMock,
        });

        await expect(
            logoutRuntimeSession({
                canUseHostedSessionApi: true,
            }),
        ).resolves.toBeUndefined();

        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining('/auth/logout'),
            expect.objectContaining({
                method: 'POST',
                credentials: 'include',
            }),
        );
    });

    it('saves browser fallback accounts into local storage and enforces account limits', async () => {
        const sysAdminAccount = {
            userId: 'sysadmin_1',
            username: 'sysadmin',
            displayName: 'System Administrator',
            role: 'SysAdmin',
            isActive: true,
            passwordConfigured: true,
            usesDefaultPassword: false,
        } as const;
        const nextUser = {
            userId: 'user_1',
            username: 'operator',
            displayName: 'Operator',
            role: 'User',
            isActive: true,
            passwordConfigured: false,
            usesDefaultPassword: false,
        } as const;
        const existingAdmin = {
            ...hostedAdminAccount,
        } as const;

        await expect(
            saveRuntimeAccount({
                accounts: [sysAdminAccount],
                canUseHostedSessionApi: false,
                nextAccount: nextUser,
            }),
        ).resolves.toEqual({
            nextAccounts: [sysAdminAccount, nextUser],
            savedAccount: nextUser,
        });

        expect(window.localStorage.getItem(localSetupAccountsStorageKey)).toContain('"user_1"');

        await expect(
            saveRuntimeAccount({
                accounts: [sysAdminAccount, existingAdmin],
                canUseHostedSessionApi: false,
                nextAccount: {
                    userId: 'admin_2',
                    username: 'admin-2',
                    displayName: 'Second Admin',
                    role: 'Admin',
                    isActive: true,
                    passwordConfigured: true,
                    usesDefaultPassword: false,
                },
            }),
        ).rejects.toThrow('VaultBill allows one active Administrator.');
    });

    it('archives browser fallback accounts and protects the System Administrator', async () => {
        const sysAdminAccount = {
            userId: 'sysadmin_1',
            username: 'sysadmin',
            displayName: 'System Administrator',
            role: 'SysAdmin',
            isActive: true,
            passwordConfigured: true,
            usesDefaultPassword: false,
        } as const;
        const userAccount = {
            userId: 'user_1',
            username: 'operator',
            displayName: 'Operator',
            role: 'User',
            isActive: true,
            passwordConfigured: false,
            usesDefaultPassword: false,
        } as const;

        await expect(
            archiveRuntimeAccount({
                accounts: [sysAdminAccount, userAccount],
                canUseHostedSessionApi: false,
                userId: userAccount.userId,
            }),
        ).resolves.toBe(userAccount.userId);

        expect(window.localStorage.getItem(localSetupAccountsStorageKey)).toContain(
            '"isActive":false',
        );

        await expect(
            archiveRuntimeAccount({
                accounts: [sysAdminAccount, userAccount],
                canUseHostedSessionApi: false,
                userId: sysAdminAccount.userId,
            }),
        ).rejects.toThrow('The System Administrator cannot be removed.');
    });

    it('resets browser fallback passwords in the static hosted browser build', async () => {
        const browserAccount = {
            ...hostedAdminAccount,
            passwordHash: defaultPasswordHash,
            usesDefaultPassword: true,
        };

        await expect(
            resetRuntimeAccountPassword({
                accounts: [browserAccount],
                canUseHostedSessionApi: false,
                password: 'new-password',
                userId: browserAccount.userId,
                usesStaticHostedBrowserBuild: true,
            }),
        ).resolves.toMatchObject({
            userId: browserAccount.userId,
            usesDefaultPassword: false,
        });

        expect(window.localStorage.getItem(localSetupAccountsStorageKey)).toContain(
            '"usesDefaultPassword":false',
        );

        await expect(
            resetRuntimeAccountPassword({
                accounts: [browserAccount],
                canUseHostedSessionApi: false,
                password: 'another-password',
                userId: browserAccount.userId,
                usesStaticHostedBrowserBuild: false,
            }),
        ).rejects.toThrow('Password reset is unavailable in this runtime.');
    });
});
