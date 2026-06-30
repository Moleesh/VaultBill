/** @format */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FC, PropsWithChildren } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import {
    canUseLocalHostedApi,
    hostedApiRecoveredEvent,
    hostedApiUnavailableEvent,
    requestHostedApi,
    setHostedCsrfToken,
} from '../../runtime/HostedApi';
import { isStaticHostedBrowserBuild } from '../../runtime/RuntimeMode';
import { bootstrapOperatorAccounts, createOperatorContext } from './AccountBootstrap';
import type { OperatorAccount } from './AccountTypes';
import { createSessionActions } from './SessionActions';
import { SessionContext } from './SessionContextBase';
import { demoAccount } from './SessionSupport';
import type { SessionContextValue } from './SessionTypes';

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
    const usesStaticHostedBrowserBuild = isStaticHostedBrowserBuild(capabilities);
    const canUseHostedSessionApi =
        window.vaultBillDesktop === undefined &&
        !usesStaticHostedBrowserBuild &&
        (capabilities.isHostedWeb || canUseLocalHostedApi());
    const [hostedConnectionState, setHostedConnectionState] = useState<
        SessionContextValue['hostedConnectionState']
    >(canUseHostedSessionApi ? 'connecting' : 'connected');
    const hostedConnectionStateRef = useRef<SessionContextValue['hostedConnectionState']>(
        canUseHostedSessionApi ? 'connecting' : 'connected',
    );
    const [accounts, setAccounts] = useState<readonly OperatorAccount[]>(() =>
        usesStaticHostedBrowserBuild
            ? [demoAccount]
            : canUseHostedSessionApi
              ? []
              : window.vaultBillDesktop
                ? []
                : bootstrapOperatorAccounts,
    );
    const [account, setAccount] = useState<OperatorAccount | undefined>();

    useEffect(() => {
        hostedConnectionStateRef.current = hostedConnectionState;
    }, [hostedConnectionState]);

    useEffect(() => {
        const bridge = window.vaultBillDesktop;
        if (!bridge || usesStaticHostedBrowserBuild) return;

        let isCurrent = true;

        const refreshDesktopAccounts = () => {
            void bridge
                .listAccounts()
                .then(async (desktopAccounts) => {
                    if (desktopAccounts.some((account) => account.isActive)) {
                        return desktopAccounts;
                    }

                    try {
                        return await requestHostedApi<readonly OperatorAccount[]>('/auth/accounts');
                    } catch {
                        return desktopAccounts;
                    }
                })
                .then((nextAccounts) => {
                    if (!isCurrent) return;
                    setAccounts(nextAccounts);
                })
                .catch(() => {
                    if (!isCurrent) return;
                    setAccounts([]);
                });
        };

        refreshDesktopAccounts();

        const refreshOnFocus = () => {
            if (document.visibilityState === 'hidden') return;
            refreshDesktopAccounts();
        };
        window.addEventListener('focus', refreshOnFocus);
        document.addEventListener('visibilitychange', refreshOnFocus);

        return () => {
            isCurrent = false;
            window.removeEventListener('focus', refreshOnFocus);
            document.removeEventListener('visibilitychange', refreshOnFocus);
        };
    }, [usesStaticHostedBrowserBuild]);

    useEffect(() => {
        if (!canUseHostedSessionApi) return;

        let isCurrent = true;
        let isRefreshInFlight = false;

        const applyUnavailableState = () => {
            if (!isCurrent) return;
            setAccounts([]);
            setAccount(undefined);
            setHostedCsrfToken(undefined);
            setHostedConnectionState('unavailable');
        };

        const refreshHostedSession = () => {
            if (isRefreshInFlight) return;
            isRefreshInFlight = true;
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
                })
                .finally(() => {
                    isRefreshInFlight = false;
                });
        };

        refreshHostedSession();
        const refreshOnFocus = () => {
            if (document.visibilityState === 'hidden') return;
            refreshHostedSession();
        };
        const handleHostedApiUnavailable = () => {
            applyUnavailableState();
        };
        const handleHostedApiRecovered = () => {
            if (hostedConnectionStateRef.current === 'connected') return;
            refreshHostedSession();
        };
        window.addEventListener('focus', refreshOnFocus);
        document.addEventListener('visibilitychange', refreshOnFocus);
        window.addEventListener(hostedApiUnavailableEvent, handleHostedApiUnavailable);
        window.addEventListener(hostedApiRecoveredEvent, handleHostedApiRecovered);

        return () => {
            isCurrent = false;
            window.removeEventListener('focus', refreshOnFocus);
            document.removeEventListener('visibilitychange', refreshOnFocus);
            window.removeEventListener(hostedApiUnavailableEvent, handleHostedApiUnavailable);
            window.removeEventListener(hostedApiRecoveredEvent, handleHostedApiRecovered);
        };
    }, [canUseHostedSessionApi]);

    const actions = useMemo(
        () =>
            createSessionActions({
                accounts: () => accounts,
                account: () => account,
                canUseHostedSessionApi: () => canUseHostedSessionApi,
                usesStaticHostedBrowserBuild: () => usesStaticHostedBrowserBuild,
                saveAccounts: setAccounts,
                setAccount,
                setHostedCsrfToken,
            }),
        [account, accounts, canUseHostedSessionApi, usesStaticHostedBrowserBuild],
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
