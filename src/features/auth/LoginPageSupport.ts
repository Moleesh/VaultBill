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

/** Returns the default operator and clears the legacy remembered-operator key. */
export const getLastLoginAccountId = (
    accounts: readonly OperatorAccount[],
    includeSysAdmin = false,
) => {
    const fallbackAccountId = getLoginAccountId(accounts, includeSysAdmin);

    try {
        window.localStorage.removeItem(lastLoginAccountStorageKey);
    } catch {
        return fallbackAccountId;
    }

    return fallbackAccountId;
};

/** Clears legacy operator-choice persistence so every user login starts fresh. */
export const rememberLoginAccountId = () => {
    try {
        window.localStorage.removeItem(lastLoginAccountStorageKey);
    } catch {
        // Ignore storage failures so sign-in remains available in restricted runtimes.
    }
};

/** Returns the selected account for the current login form state. */
export const findLoginAccount = (accounts: readonly OperatorAccount[], selectedAccountId: string) =>
    accounts.find((account) => account.userId === selectedAccountId);
