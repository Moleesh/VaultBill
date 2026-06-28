/** @format */

import { useEffect, useMemo, useState } from 'react';
import type { FC, PropsWithChildren } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import {
    hostedApiRecoveredEvent,
    hostedApiUnavailableEvent,
    requestHostedApi,
    setHostedCsrfToken,
} from '../../runtime/HostedApi';
import { bootstrapOperatorAccounts, createOperatorContext } from './AccountBootstrap';
import type { OperatorAccount } from './AccountTypes';
import { createSessionActions } from './SessionActions';
import { SessionContext } from './SessionContextBase';
import { demoAccount } from './SessionSupport';
import type { SessionContextValue } from './SessionTypes';

const hostedSessionRefreshIntervalMs = 3000;
const desktopSessionRefreshIntervalMs = 3000;

const readHostedSessionSnapshot = async (): Promise<{
    readonly accounts: readonly OperatorAccount[];
    readonly account: OperatorAccount | undefined;
    readonly csrfToken: string | undefined;
}> => {
    await requestHostedApi('/health');
    const [accounts, session] = await Promise.all([
        requestHostedApi<readonly OperatorAccount[]>('/auth/accounts'),
        requestHostedApi<
            | {
                  readonly account: OperatorAccount;
                  readonly csrfToken: string;
              }
            | undefined
        >('/auth/session'),
    ]);

    return {
        accounts,
        account: session?.account,
        csrfToken: session?.csrfToken,
    };
};

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

        let isCurrent = true;

        const refreshDesktopAccounts = () => {
            void bridge.listAccounts().then((desktopAccounts) => {
                if (!isCurrent) return;
                setAccounts(desktopAccounts);
            });
        };

        refreshDesktopAccounts();

        const refreshInterval = window.setInterval(
            refreshDesktopAccounts,
            desktopSessionRefreshIntervalMs,
        );
        const refreshOnFocus = () => {
            refreshDesktopAccounts();
        };
        window.addEventListener('focus', refreshOnFocus);
        document.addEventListener('visibilitychange', refreshOnFocus);

        return () => {
            isCurrent = false;
            window.clearInterval(refreshInterval);
            window.removeEventListener('focus', refreshOnFocus);
            document.removeEventListener('visibilitychange', refreshOnFocus);
        };
    }, [capabilities.isDemoMode]);

    useEffect(() => {
        if (!capabilities.isHostedWeb) return;

        let isCurrent = true;

        const applyUnavailableState = () => {
            if (!isCurrent) return;
            setAccounts([]);
            setAccount(undefined);
            setHostedCsrfToken(undefined);
            setHostedConnectionState('unavailable');
        };

        const refreshHostedSession = () => {
            setHostedConnectionState((current) =>
                current === 'connected' ? current : 'connecting',
            );
            void readHostedSessionSnapshot()
                .then((snapshot) => {
                    if (!isCurrent) return;
                    setAccounts(snapshot.accounts);
                    setAccount(snapshot.account);
                    setHostedCsrfToken(snapshot.csrfToken);
                    setHostedConnectionState('connected');
                })
                .catch(() => {
                    applyUnavailableState();
                });
        };

        refreshHostedSession();

        const refreshInterval = window.setInterval(
            refreshHostedSession,
            hostedSessionRefreshIntervalMs,
        );
        const refreshOnFocus = () => {
            refreshHostedSession();
        };
        const handleHostedApiUnavailable = () => {
            applyUnavailableState();
        };
        const handleHostedApiRecovered = () => {
            refreshHostedSession();
        };
        window.addEventListener('focus', refreshOnFocus);
        document.addEventListener('visibilitychange', refreshOnFocus);
        window.addEventListener(hostedApiUnavailableEvent, handleHostedApiUnavailable);
        window.addEventListener(hostedApiRecoveredEvent, handleHostedApiRecovered);

        return () => {
            isCurrent = false;
            window.clearInterval(refreshInterval);
            window.removeEventListener('focus', refreshOnFocus);
            document.removeEventListener('visibilitychange', refreshOnFocus);
            window.removeEventListener(hostedApiUnavailableEvent, handleHostedApiUnavailable);
            window.removeEventListener(hostedApiRecoveredEvent, handleHostedApiRecovered);
        };
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
