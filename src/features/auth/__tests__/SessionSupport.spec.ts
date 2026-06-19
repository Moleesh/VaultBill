/** @format */

/**
 * Covers the session helpers that seed browser fallback accounts and enforce
 * the small managed-account limits.
 */

import { describe, expect, it } from 'vitest';

import { bootstrapOperatorAccounts } from '../AccountBootstrap';
import type { OperatorAccount } from '../AccountTypes';
import {
    defaultPasswordHash,
    demoAccount,
    fallbackBrowserAccounts,
    hashPassword,
    validateManagedAccounts,
} from '../SessionSupport';

describe('SessionSupport', () => {
    it('exposes the seeded demo and browser fallback accounts', () => {
        expect(defaultPasswordHash).toHaveLength(64);
        expect(demoAccount.displayName).toBe('Demo User');
        expect(fallbackBrowserAccounts).toEqual(bootstrapOperatorAccounts);
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
