/** @format */

import { useEffect, useMemo, useState } from 'react';
import type { FC, PropsWithChildren } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import { requestHostedApi, setHostedCsrfToken } from '../../runtime/HostedApi';
import { createOperatorContext } from './AccountBootstrap';
import type { OperatorAccount } from './AccountTypes';
import { createSessionActions } from './SessionActions';
import { SessionContext } from './SessionContextBase';
import { demoAccount, readStoredAccounts, sessionStorageKey } from './SessionSupport';
import type { SessionContextValue } from './SessionTypes';

/**
 * Supplies the active operator session for browser, LAN, and desktop modes.
 */
export const SessionProvider: FC<PropsWithChildren> = ({ children }) => {
    const capabilities = useCapabilities();
    const [hostedConnectionState, setHostedConnectionState] = useState<
        SessionContextValue['hostedConnectionState']
    >(capabilities.isLanBrowser ? 'connecting' : 'connected');
    const [accounts, setAccounts] = useState<readonly OperatorAccount[]>(() =>
        capabilities.isDemoMode
            ? [demoAccount]
            : capabilities.isLanBrowser
              ? []
              : readStoredAccounts(),
    );
    const [account, setAccount] = useState<OperatorAccount | undefined>(() =>
        capabilities.isLanBrowser
            ? undefined
            : accounts.find(
                  (candidate) =>
                      candidate.userId === window.localStorage.getItem(sessionStorageKey) &&
                      candidate.isActive,
              ),
    );

    useEffect(() => {
        const bridge = window.vaultBillDesktop;
        if (!bridge || capabilities.isDemoMode) return;

        void bridge.listAccounts().then((desktopAccounts) => {
            setAccounts(desktopAccounts);
            const currentId = window.localStorage.getItem(sessionStorageKey);
            setAccount(
                desktopAccounts.find(
                    (candidate) => candidate.userId === currentId && candidate.isActive,
                ),
            );
        });
    }, [capabilities.isDemoMode]);

    useEffect(() => {
        if (!capabilities.isLanBrowser) return;

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
    }, [capabilities.isLanBrowser]);

    const actions = useMemo(
        () =>
            createSessionActions({
                accounts: () => accounts,
                account: () => account,
                isDemoMode: () => capabilities.isDemoMode,
                isLanBrowser: () => capabilities.isLanBrowser,
                saveAccounts: setAccounts,
                setAccount,
                setHostedCsrfToken,
            }),
        [account, accounts, capabilities.isDemoMode, capabilities.isLanBrowser],
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
