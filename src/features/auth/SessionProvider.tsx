/** @format */

import { useEffect, useMemo, useState } from 'react';
import type { FC, PropsWithChildren } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import { requestHostedApi, setHostedCsrfToken } from '../../runtime/HostedApi';
import { bootstrapOperatorAccounts, createOperatorContext } from './AccountBootstrap';
import type { OperatorAccount } from './AccountTypes';
import { createSessionActions } from './SessionActions';
import { SessionContext } from './SessionContextBase';
import { demoAccount } from './SessionSupport';
import type { SessionContextValue } from './SessionTypes';

/** Supplies the active operator session for demo, hosted web, and desktop modes. */
export const SessionProvider: FC<PropsWithChildren> = ({ children }) => {
    const capabilities = useCapabilities();
    const [hostedConnectionState, setHostedConnectionState] = useState<
        SessionContextValue['hostedConnectionState']
    >(capabilities.isHostedWeb ? 'connecting' : 'connected');
    const [accounts, setAccounts] = useState<readonly OperatorAccount[]>(() =>
        capabilities.isDemoMode
            ? [demoAccount]
            : capabilities.isHostedWeb
              ? []
              : window.vaultBillDesktop
                ? []
                : bootstrapOperatorAccounts,
    );
    const [account, setAccount] = useState<OperatorAccount | undefined>();

    useEffect(() => {
        const bridge = window.vaultBillDesktop;
        if (!bridge || capabilities.isDemoMode) return;

        void bridge.listAccounts().then((desktopAccounts) => {
            setAccounts(desktopAccounts);
            setAccount(undefined);
        });
    }, [capabilities.isDemoMode]);

    useEffect(() => {
        if (!capabilities.isHostedWeb) return;

        void Promise.all([
            requestHostedApi<readonly OperatorAccount[]>('/auth/accounts'),
            requestHostedApi<
                | {
                      readonly account: OperatorAccount;
                      readonly csrfToken: string;
                  }
                | undefined
            >('/auth/session'),
        ])
            .then(([hostedAccounts, hostedSession]) => {
                setAccounts(hostedAccounts);
                setAccount(hostedSession?.account);
                setHostedCsrfToken(hostedSession?.csrfToken);
                setHostedConnectionState('connected');
            })
            .catch(() => {
                setAccounts([]);
                setAccount(undefined);
                setHostedCsrfToken(undefined);
                setHostedConnectionState('unavailable');
            });
    }, [capabilities.isHostedWeb]);

    const actions = useMemo(
        () =>
            createSessionActions({
                accounts: () => accounts,
                account: () => account,
                isDemoMode: () => capabilities.isDemoMode,
                isHostedWeb: () => capabilities.isHostedWeb,
                saveAccounts: setAccounts,
                setAccount,
                setHostedCsrfToken,
            }),
        [account, accounts, capabilities.isDemoMode, capabilities.isHostedWeb],
    );

    return (
        <SessionContext.Provider
            value={{
                accounts,
                operatorContext: account ? createOperatorContext(account) : undefined,
                hostedConnectionState,
                login: actions.login,
                logout: actions.logout,
                saveAccount: actions.saveAccount,
                archiveAccount: actions.archiveAccount,
                resetPassword: actions.resetPassword,
            }}
        >
            {children}
        </SessionContext.Provider>
    );
};
