/** @format */

/**
 * Shared session helpers for demo accounts and hosted login validation.
 */

import { bootstrapOperatorAccounts } from './AccountBootstrap';
import type { OperatorAccount } from './AccountTypes';

/** Default password hash used for the seeded desktop accounts. */
export const defaultPasswordHash =
    '5e800c5e134b84a0d73bd6f0d0f65b768f8a3afeba9c26ce3fe9b8d58fd027f1';
export const operatorStorageKey = 'vaultbill.operator';

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

/** Seeded accounts kept only for the plain browser fallback runtime. */
export const fallbackBrowserAccounts = bootstrapOperatorAccounts;

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

export const getStoredOperatorId = (): string | undefined => {
    const stored = window.localStorage.getItem(operatorStorageKey);
    return stored && stored.trim().length > 0 ? stored : undefined;
};

export const setStoredOperatorId = (userId: string | undefined) => {
    if (userId && userId.trim().length > 0) {
        window.localStorage.setItem(operatorStorageKey, userId);
        return;
    }
    window.localStorage.removeItem(operatorStorageKey);
};
