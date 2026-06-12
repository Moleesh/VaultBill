/** @format */

/**
 * Shared session helpers for browser storage, demo accounts, and hosted login
 * validation.
 */

import { bootstrapOperatorAccounts } from './AccountBootstrap';
import type { OperatorAccount } from './AccountTypes';

/** Storage key for the active operator id. */
export const sessionStorageKey = 'vaultbill.operator';
/** Storage key for the serialized account list. */
export const accountStorageKey = 'vaultbill.accounts';
/** Default password hash used for the seeded desktop accounts. */
export const defaultPasswordHash =
    '5e800c5e134b84a0d73bd6f0d0f65b768f8a3afeba9c26ce3fe9b8d58fd027f1';

/** Demo account used when the browser runs without a saved operator session. */
export const demoAccount: OperatorAccount = {
    userId: 'demo_user',
    username: 'demo',
    displayName: 'Demo User',
    role: 'Admin',
    isActive: true,
};

/** Payload stored in hosted sessions when the desktop API authenticates login. */
export type HostedSessionPayload = {
    readonly account: OperatorAccount;
    readonly csrfToken: string;
};

/** Reads the saved account list or falls back to the seeded bootstrap set. */
export const readStoredAccounts = (): readonly OperatorAccount[] => {
    const rawAccounts = window.localStorage.getItem(accountStorageKey);

    if (!rawAccounts) {
        return bootstrapOperatorAccounts;
    }

    try {
        const parsedAccounts = JSON.parse(rawAccounts) as readonly OperatorAccount[];
        return parsedAccounts.length > 0 ? parsedAccounts : bootstrapOperatorAccounts;
    } catch {
        return bootstrapOperatorAccounts;
    }
};

/** Hashes passwords with SHA-256 for the browser-hosted fallback flow. */
export const hashPassword = async (password: string): Promise<string> => {
    const bytes = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
};

/** Enforces the simple browser-side account limits used by the demo host. */
export const validateManagedAccounts = (accounts: readonly OperatorAccount[]): string => {
    const active = accounts.filter((account) => account.isActive);
    if (active.filter((account) => account.role === 'SysAdmin').length !== 1) {
        return 'VaultBill requires exactly one active System Administrator.';
    }
    if (active.filter((account) => account.role === 'Admin').length > 1) {
        return 'VaultBill allows one active Administrator.';
    }
    if (active.filter((account) => account.role === 'User').length > 5) {
        return 'VaultBill allows up to five active Users.';
    }
    return '';
};
