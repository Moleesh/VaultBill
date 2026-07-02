/** @format */
/* eslint-disable max-lines */

import type { FC, PropsWithChildren } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useCapabilities } from '../../capability/CapabilityContext';
import { getRuntimeQueryScope, queryKeys } from '../../query/QueryKeys';
import {
    archiveRuntimeAccount,
    fetchSessionSnapshot,
    loginRuntimeSession,
    logoutRuntimeSession,
    resetRuntimeAccountPassword,
    saveRuntimeAccount,
} from '../../query/RuntimeQueries';
import {
    canUseLocalHostedApi,
    hostedApiRecoveredEvent,
    hostedApiUnavailableEvent,
    setHostedCsrfToken,
} from '../../runtime/HostedApi';
import { isStaticHostedBrowserBuild } from '../../runtime/RuntimeMode';
import { bootstrapOperatorAccounts, createOperatorContext } from './AccountBootstrap';
import type { OperatorAccount } from './AccountTypes';
import { SessionContext } from './SessionContextBase';
import { demoAccount, getStoredOperatorId, setStoredOperatorId } from './SessionSupport';
import type { SessionContextValue } from './SessionTypes';

/** Supplies the active operator session for demo, hosted web, and desktop modes. */
export const SessionProvider: FC<PropsWithChildren<{ readonly refreshRevision?: number }>> = ({
    children,
    refreshRevision = 0,
}) => {
    const capabilities = useCapabilities();
    const queryClient = useQueryClient();
    const usesStaticHostedBrowserBuild = isStaticHostedBrowserBuild(capabilities);
    const canUseHostedSessionApi =
        window.vaultBillDesktop === undefined &&
        !usesStaticHostedBrowserBuild &&
        (capabilities.isHostedWeb || canUseLocalHostedApi());
    const runtimeScope = getRuntimeQueryScope(capabilities);
    const [hostedApiUnavailable, setHostedApiUnavailable] = useState(false);
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
    const sessionQuery = useQuery({
        queryKey: queryKeys.session(runtimeScope),
        enabled:
            !usesStaticHostedBrowserBuild && (canUseHostedSessionApi || !!window.vaultBillDesktop),
        queryFn: () =>
            fetchSessionSnapshot({
                canUseHostedSessionApi,
                usesStaticHostedBrowserBuild,
            }),
    });
    const hostedConnectionState: SessionContextValue['hostedConnectionState'] =
        canUseHostedSessionApi
            ? hostedApiUnavailable || sessionQuery.isError
                ? 'unavailable'
                : sessionQuery.isPending
                  ? 'connecting'
                  : 'connected'
            : 'connected';
    const hostedConnectionStateRef =
        useRef<SessionContextValue['hostedConnectionState']>(hostedConnectionState);

    useEffect(() => {
        hostedConnectionStateRef.current = hostedConnectionState;
    }, [hostedConnectionState]);

    useEffect(() => {
        if (usesStaticHostedBrowserBuild) {
            setAccounts([demoAccount]);
            setAccount(undefined);
            setStoredOperatorId(undefined);
            setHostedCsrfToken(undefined);
            setHostedApiUnavailable(false);
            return;
        }

        if (sessionQuery.data) {
            setAccounts(sessionQuery.data.accounts);
            if (sessionQuery.data.account) {
                setAccount(sessionQuery.data.account);
                setStoredOperatorId(sessionQuery.data.account.userId);
            } else if (canUseHostedSessionApi) {
                setAccount(undefined);
            }
            setHostedCsrfToken(sessionQuery.data.csrfToken);
            setHostedApiUnavailable(false);
            return;
        }

        if (!sessionQuery.isError) return;

        if (canUseHostedSessionApi) {
            setAccounts([]);
            setAccount(undefined);
            setStoredOperatorId(undefined);
            setHostedCsrfToken(undefined);
            setHostedApiUnavailable(true);
            return;
        }

        setAccounts([]);
    }, [
        canUseHostedSessionApi,
        sessionQuery.data,
        sessionQuery.isError,
        usesStaticHostedBrowserBuild,
    ]);

    useEffect(() => {
        if (usesStaticHostedBrowserBuild) return;

        const refreshOnFocus = () => {
            if (document.visibilityState === 'hidden') return;
            void queryClient.invalidateQueries({
                queryKey: queryKeys.session(runtimeScope),
            });
        };
        const handleHostedApiUnavailable = () => {
            setHostedApiUnavailable(true);
        };
        const handleHostedApiRecovered = () => {
            setHostedApiUnavailable(false);
            if (hostedConnectionStateRef.current === 'connected') return;
            void queryClient.invalidateQueries({
                queryKey: queryKeys.session(runtimeScope),
            });
        };
        window.addEventListener('focus', refreshOnFocus);
        document.addEventListener('visibilitychange', refreshOnFocus);
        window.addEventListener(hostedApiUnavailableEvent, handleHostedApiUnavailable);
        window.addEventListener(hostedApiRecoveredEvent, handleHostedApiRecovered);

        return () => {
            window.removeEventListener('focus', refreshOnFocus);
            document.removeEventListener('visibilitychange', refreshOnFocus);
            window.removeEventListener(hostedApiUnavailableEvent, handleHostedApiUnavailable);
            window.removeEventListener(hostedApiRecoveredEvent, handleHostedApiRecovered);
        };
    }, [queryClient, runtimeScope, usesStaticHostedBrowserBuild]);

    useEffect(() => {
        if (refreshRevision === 0) return;
        void queryClient.invalidateQueries({
            queryKey: queryKeys.session(runtimeScope),
        });
    }, [queryClient, refreshRevision, runtimeScope]);

    const invalidateRuntimeState = () =>
        Promise.all([
            queryClient.invalidateQueries({
                queryKey: queryKeys.session(runtimeScope),
            }),
            queryClient.invalidateQueries({
                queryKey: queryKeys.setupStatus(runtimeScope),
            }),
            queryClient.invalidateQueries({
                queryKey: queryKeys.setupDefaults(runtimeScope),
            }),
        ]).then(() => undefined);
    const persistAccounts = (nextAccounts: readonly OperatorAccount[]) => {
        setAccounts(nextAccounts);
    };
    const loginMutation = useMutation({
        mutationFn: async ({
            password = '',
            userId,
        }: {
            readonly password?: string;
            readonly userId: string;
        }) =>
            loginRuntimeSession({
                accounts,
                canUseHostedSessionApi,
                password,
                userId,
            }),
        onSuccess: ({ account: nextAccount, csrfToken }) => {
            setAccount(nextAccount);
            setStoredOperatorId(nextAccount.userId);
            if (csrfToken !== undefined) setHostedCsrfToken(csrfToken);
            void invalidateRuntimeState();
        },
    });
    const logoutMutation = useMutation({
        mutationFn: () => logoutRuntimeSession({ canUseHostedSessionApi }),
        onSettled: () => {
            setHostedCsrfToken(undefined);
            setAccount(undefined);
            setStoredOperatorId(undefined);
            void invalidateRuntimeState();
        },
    });
    const saveAccountMutation = useMutation({
        mutationFn: (nextAccount: OperatorAccount) =>
            saveRuntimeAccount({
                accounts,
                canUseHostedSessionApi,
                nextAccount,
            }),
        onSuccess: ({ nextAccounts, savedAccount }) => {
            persistAccounts(nextAccounts);
            if (account?.userId === savedAccount.userId) {
                setAccount(savedAccount);
                setStoredOperatorId(savedAccount.userId);
            }
            void invalidateRuntimeState();
        },
    });
    const archiveAccountMutation = useMutation({
        mutationFn: (userId: string) =>
            archiveRuntimeAccount({
                canUseHostedSessionApi,
                userId,
            }),
        onSuccess: (userId) => {
            persistAccounts(
                accounts.map((candidate) =>
                    candidate.userId === userId ? { ...candidate, isActive: false } : candidate,
                ),
            );
            if (account?.userId === userId || getStoredOperatorId() === userId) {
                setAccount(undefined);
                setStoredOperatorId(undefined);
            }
            void invalidateRuntimeState();
        },
    });
    const resetPasswordMutation = useMutation({
        mutationFn: ({
            password,
            userId,
        }: {
            readonly password: string;
            readonly userId: string;
        }) =>
            resetRuntimeAccountPassword({
                accounts,
                canUseHostedSessionApi,
                password,
                userId,
                usesStaticHostedBrowserBuild,
            }),
        onSuccess: (savedAccount) => {
            persistAccounts(
                accounts.map((candidate) =>
                    candidate.userId === savedAccount.userId ? savedAccount : candidate,
                ),
            );
            if (account?.userId === savedAccount.userId) {
                setAccount(savedAccount);
                setStoredOperatorId(savedAccount.userId);
            }
            void invalidateRuntimeState();
        },
    });

    const sessionValue = useMemo(
        () =>
            ({
                accounts,
                operatorContext: account ? createOperatorContext(account) : undefined,
                hostedConnectionState,
                login: (userId: string, password?: string) =>
                    loginMutation
                        .mutateAsync({ userId, ...(password !== undefined ? { password } : {}) })
                        .then(() => undefined),
                logout: () => {
                    void logoutMutation.mutateAsync();
                },
                saveAccount: (nextAccount: OperatorAccount) =>
                    saveAccountMutation.mutateAsync(nextAccount).then(() => undefined),
                archiveAccount: (userId: string) =>
                    archiveAccountMutation.mutateAsync(userId).then(() => undefined),
                resetPassword: (userId: string, password: string) =>
                    resetPasswordMutation.mutateAsync({ userId, password }).then(() => undefined),
            }) satisfies SessionContextValue,
        [
            account,
            accounts,
            archiveAccountMutation,
            hostedConnectionState,
            loginMutation,
            logoutMutation,
            resetPasswordMutation,
            saveAccountMutation,
        ],
    );

    return <SessionContext.Provider value={sessionValue}>{children}</SessionContext.Provider>;
};
