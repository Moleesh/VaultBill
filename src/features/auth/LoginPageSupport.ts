/** @format */

import type { OperatorAccount } from './AccountTypes';

/** Builds searchable operator options from the current session accounts. */
export const buildLoginAccountOptions = (accounts: readonly OperatorAccount[]) =>
    accounts.map((account) => ({
        value: account.userId,
        label: account.displayName,
        description: `${account.username} · ${account.role}`,
        keywords: [account.username, account.role],
    }));

/** Returns the selected account for the current login form state. */
export const findLoginAccount = (
    accounts: readonly OperatorAccount[],
    selectedAccountId: string,
) => accounts.find((account) => account.userId === selectedAccountId);
