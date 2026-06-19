/** @format */

import { createOperatorContext } from '../features/auth/AccountBootstrap';
import type { OperatorAccount } from '../features/auth/AccountTypes';
import type { SessionContextValue } from '../features/auth/SessionTypes';

export const createTestSession = (
    account: OperatorAccount,
    accounts: readonly OperatorAccount[] = [account],
): SessionContextValue => ({
    accounts,
    operatorContext: createOperatorContext(account),
    hostedConnectionState: 'connected',
    login: () => Promise.resolve(),
    logout: () => undefined,
    saveAccount: () => Promise.resolve(),
    archiveAccount: () => Promise.resolve(),
    resetPassword: () => Promise.resolve(),
});
