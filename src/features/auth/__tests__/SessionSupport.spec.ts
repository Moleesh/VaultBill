/** @format */

/**
 * Covers the browser session helpers that seed accounts, hash passwords, and
 * enforce the small demo-host account limits.
 */

import { afterEach, describe, expect, it } from 'vitest';

import { bootstrapOperatorAccounts } from '../AccountBootstrap';
import type { OperatorAccount } from '../AccountTypes';
import {
    accountStorageKey,
    defaultPasswordHash,
    demoAccount,
    hashPassword,
    readStoredAccounts,
    sessionStorageKey,
    validateManagedAccounts,
} from '../SessionSupport';

afterEach(() => {
    window.localStorage.clear();
});

describe('SessionSupport', () => {
    it('exposes the seeded demo account and storage keys', () => {
        expect(sessionStorageKey).toBe('vaultbill.operator');
        expect(accountStorageKey).toBe('vaultbill.accounts');
        expect(defaultPasswordHash).toHaveLength(64);
        expect(demoAccount.displayName).toBe('Demo User');
    });

    it('reads saved accounts or falls back to the bootstrap set', () => {
        expect(readStoredAccounts()).toEqual(bootstrapOperatorAccounts);

        window.localStorage.setItem(
            accountStorageKey,
            JSON.stringify([{ ...bootstrapOperatorAccounts[0], displayName: 'Updated' }]),
        );
        expect(readStoredAccounts()[0]?.displayName).toBe('Updated');

        window.localStorage.setItem(accountStorageKey, '{not-json');
        expect(readStoredAccounts()).toEqual(bootstrapOperatorAccounts);
    });

    it('hashes passwords and validates active account limits', async () => {
        await expect(hashPassword('VaultBill!')).resolves.toHaveLength(64);
        const sysAdmin = bootstrapOperatorAccounts[0];
        if (!sysAdmin) throw new Error('Missing bootstrap operator account.');
        if (!sysAdmin.passwordHash) throw new Error('Missing bootstrap password hash.');
        const firstAdmin: OperatorAccount = {
            userId: 'admin_1',
            username: 'admin',
            displayName: 'Operations Admin',
            role: 'Admin',
            isActive: true,
            passwordHash: sysAdmin.passwordHash,
            usesDefaultPassword: true,
        };
        const secondAdmin: OperatorAccount = {
            ...firstAdmin,
            userId: 'admin_2',
            username: 'admin-2',
            displayName: 'Backup Admin',
        };
        expect(validateManagedAccounts([sysAdmin, firstAdmin, secondAdmin])).toContain(
            'one active Administrator',
        );
        expect(validateManagedAccounts([sysAdmin])).toBe('');
    });
});
