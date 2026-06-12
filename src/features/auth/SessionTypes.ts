/** @format */

import type { OperatorAccount, OperatorContext } from './AccountTypes';

export type SessionContextValue = {
    readonly accounts: readonly OperatorAccount[];
    readonly operatorContext: OperatorContext | undefined;
    readonly hostedConnectionState: 'connecting' | 'connected' | 'unavailable';
    readonly login: (userId: string, password?: string) => Promise<void>;
    readonly logout: () => void;
    readonly saveAccount: (account: OperatorAccount) => Promise<void>;
    readonly archiveAccount: (userId: string) => Promise<void>;
    readonly resetPassword: (userId: string, password: string) => Promise<void>;
};
