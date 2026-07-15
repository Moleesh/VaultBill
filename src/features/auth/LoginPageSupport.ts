/** @format */

import type { OperatorAccount } from './AccountTypes';

const lastLoginAccountStorageKey = 'vaultbill.login.last-operator';

const isSelectableLoginAccount = (account: OperatorAccount, includeSysAdmin: boolean) =>
    account.isActive && (includeSysAdmin || account.role !== 'SysAdmin');

/** Builds searchable operator options from the current session accounts. */
export const buildLoginAccountOptions = (
    accounts: readonly OperatorAccount[],
    includeSysAdmin = false,
) =>
    accounts
        .filter((account) => isSelectableLoginAccount(account, includeSysAdmin))
        .map((account) => ({
            value: account.userId,
            label: account.displayName,
            description: `${account.username} · ${account.role}`,
            keywords: [account.username, account.role],
        }));

/** Returns the first selectable operator account for the login form. */
export const getLoginAccountId = (accounts: readonly OperatorAccount[], includeSysAdmin = false) =>
    accounts.find((account) => isSelectableLoginAccount(account, includeSysAdmin))?.userId ?? '';

/** Returns the last selected operator when it is still available. */
export const getLastLoginAccountId = (
    accounts: readonly OperatorAccount[],
    includeSysAdmin = false,
) => {
    const fallbackAccountId = getLoginAccountId(accounts, includeSysAdmin);

    try {
        const storedAccountId = window.localStorage.getItem(lastLoginAccountStorageKey);
        const storedAccount = accounts.find((account) => account.userId === storedAccountId);
        if (storedAccount && isSelectableLoginAccount(storedAccount, includeSysAdmin)) {
            return storedAccount.userId;
        }
    } catch {
        return fallbackAccountId;
    }

    return fallbackAccountId;
};

/** Remembers the operator choice without restoring a logged-in desktop session. */
export const rememberLoginAccountId = (userId: string) => {
    try {
        if (userId.trim().length > 0) {
            window.localStorage.setItem(lastLoginAccountStorageKey, userId);
            return;
        }
        window.localStorage.removeItem(lastLoginAccountStorageKey);
    } catch {
        // Ignore storage failures so sign-in remains available in restricted runtimes.
    }
};

/** Returns the selected account for the current login form state. */
export const findLoginAccount = (accounts: readonly OperatorAccount[], selectedAccountId: string) =>
    accounts.find((account) => account.userId === selectedAccountId);
