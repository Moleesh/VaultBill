/** @format */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchSessionSnapshot } from '../RuntimeQueries';

describe('RuntimeQueries', () => {
    beforeEach(() => {
        window.localStorage.clear();
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
});
