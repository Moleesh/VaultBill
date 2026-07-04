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
    const sessionQueryKey = queryKeys.session(runtimeScope);
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
        queryKey: sessionQueryKey,
        enabled:
            !usesStaticHostedBrowserBuild && (canUseHostedSessionApi || !!window.vaultBillDesktop),
        staleTime: Number.POSITIVE_INFINITY,
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

        const handleHostedApiUnavailable = () => {
            setHostedApiUnavailable(true);
        };
        const handleHostedApiRecovered = () => {
            setHostedApiUnavailable(false);
            if (hostedConnectionStateRef.current === 'connected') return;
            void queryClient.invalidateQueries({
                queryKey: sessionQueryKey,
            });
        };
        window.addEventListener(hostedApiUnavailableEvent, handleHostedApiUnavailable);
        window.addEventListener(hostedApiRecoveredEvent, handleHostedApiRecovered);

        return () => {
            window.removeEventListener(hostedApiUnavailableEvent, handleHostedApiUnavailable);
            window.removeEventListener(hostedApiRecoveredEvent, handleHostedApiRecovered);
        };
    }, [queryClient, sessionQueryKey, usesStaticHostedBrowserBuild]);

    useEffect(() => {
        if (refreshRevision === 0) return;
        void queryClient.invalidateQueries({
            queryKey: sessionQueryKey,
        });
    }, [queryClient, refreshRevision, sessionQueryKey]);

    const syncSessionSnapshot = ({
        account: nextAccount,
        accounts: nextAccounts,
        csrfToken,
    }: {
        readonly account: OperatorAccount | undefined;
        readonly accounts: readonly OperatorAccount[];
        readonly csrfToken: string | undefined;
    }) => {
        setAccounts(nextAccounts);
        setAccount(nextAccount);
        setStoredOperatorId(nextAccount?.userId);
        setHostedCsrfToken(csrfToken);
        queryClient.setQueryData(sessionQueryKey, {
            accounts: nextAccounts,
            account: nextAccount,
            csrfToken,
        });
    };

    const invalidateSetupState = () =>
        Promise.all([
            queryClient.invalidateQueries({
                queryKey: queryKeys.setupStatus(runtimeScope),
            }),
            queryClient.invalidateQueries({
                queryKey: queryKeys.setupDefaults(runtimeScope),
            }),
        ]).then(() => undefined);
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
            const nextAccounts = accounts.map((candidate) =>
                candidate.userId === nextAccount.userId ? nextAccount : candidate,
            );
            syncSessionSnapshot({
                accounts: nextAccounts,
                account: nextAccount,
                csrfToken,
            });
        },
    });
    const logoutMutation = useMutation({
        mutationFn: () => logoutRuntimeSession({ canUseHostedSessionApi }),
        onSettled: () => {
            syncSessionSnapshot({
                accounts,
                account: undefined,
                csrfToken: undefined,
            });
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
            syncSessionSnapshot({
                accounts: nextAccounts,
                account: account?.userId === savedAccount.userId ? savedAccount : account,
                csrfToken: window.sessionStorage.getItem('vaultbill.hosted.csrf') ?? undefined,
            });
            void invalidateSetupState();
        },
    });
    const archiveAccountMutation = useMutation({
        mutationFn: (userId: string) =>
            archiveRuntimeAccount({
                accounts,
                canUseHostedSessionApi,
                userId,
            }),
        onSuccess: (userId) => {
            const nextAccounts = accounts.map((candidate) =>
                candidate.userId === userId ? { ...candidate, isActive: false } : candidate,
            );
            syncSessionSnapshot({
                accounts: nextAccounts,
                account:
                    account?.userId === userId || getStoredOperatorId() === userId
                        ? undefined
                        : account,
                csrfToken:
                    account?.userId === userId || getStoredOperatorId() === userId
                        ? undefined
                        : (window.sessionStorage.getItem('vaultbill.hosted.csrf') ?? undefined),
            });
            void invalidateSetupState();
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
            const nextAccounts = accounts.map((candidate) =>
                candidate.userId === savedAccount.userId ? savedAccount : candidate,
            );
            syncSessionSnapshot({
                accounts: nextAccounts,
                account: account?.userId === savedAccount.userId ? savedAccount : account,
                csrfToken: window.sessionStorage.getItem('vaultbill.hosted.csrf') ?? undefined,
            });
            void invalidateSetupState();
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
