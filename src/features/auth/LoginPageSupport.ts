/** @format */

import type { OperatorAccount } from './AccountTypes';

/** Builds searchable operator options from the current session accounts. */
export const buildLoginAccountOptions = (
    accounts: readonly OperatorAccount[],
    includeSysAdmin = false,
) =>
    accounts
        .filter((account) => includeSysAdmin || account.role !== 'SysAdmin')
        .map((account) => ({
            value: account.userId,
            label: account.displayName,
            description: `${account.username} · ${account.role}`,
            keywords: [account.username, account.role],
        }));

/** Returns the first selectable operator account for the login form. */
export const getLoginAccountId = (accounts: readonly OperatorAccount[], includeSysAdmin = false) =>
    accounts.find((account) => includeSysAdmin || account.role !== 'SysAdmin')?.userId ?? '';

/** Returns the selected account for the current login form state. */
export const findLoginAccount = (accounts: readonly OperatorAccount[], selectedAccountId: string) =>
    accounts.find((account) => account.userId === selectedAccountId);
