/**
 * eslint-disable max-lines
 *
 * @format
 */

import { createContext, useContext, useEffect, useState } from 'react';
import type { FC, PropsWithChildren } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import { requestHostedApi, setHostedCsrfToken } from '../../runtime/HostedApi';
import { bootstrapOperatorAccounts, createOperatorContext } from './AccountBootstrap';
import type { OperatorAccount, OperatorContext } from './AccountTypes';

type SessionContextValue = {
    readonly accounts: readonly OperatorAccount[];
    readonly operatorContext: OperatorContext | undefined;
    readonly hostedConnectionState: 'connecting' | 'connected' | 'unavailable';
    readonly login: (userId: string, password?: string) => Promise<void>;
    readonly logout: () => void;
    readonly saveAccount: (account: OperatorAccount) => Promise<void>;
    readonly archiveAccount: (userId: string) => Promise<void>;
    readonly resetPassword: (userId: string, password: string) => Promise<void>;
};

const sessionStorageKey = 'vaultbill.operator';
const accountStorageKey = 'vaultbill.accounts';
const SessionContext = createContext<SessionContextValue | undefined>(undefined);
const defaultPasswordHash = '5e800c5e134b84a0d73bd6f0d0f65b768f8a3afeba9c26ce3fe9b8d58fd027f1';

const demoAccount: OperatorAccount = {
    userId: 'demo_user',
    username: 'demo',
    displayName: 'Demo User',
    role: 'Admin',
    isActive: true,
};
type HostedSessionPayload = {
    readonly account: OperatorAccount;
    readonly csrfToken: string;
};

const readStoredAccounts = (): readonly OperatorAccount[] => {
    const rawAccounts = window.localStorage.getItem(accountStorageKey);

    if (!rawAccounts) {
        return bootstrapOperatorAccounts;
    }

    try {
        const parsedAccounts = JSON.parse(rawAccounts) as readonly OperatorAccount[];
        return parsedAccounts.length > 0 ? parsedAccounts : bootstrapOperatorAccounts;
    } catch {
        return bootstrapOperatorAccounts;
    }
};

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
    const findAccount = (userId: string | null): OperatorAccount | undefined =>
        accounts.find((candidate) => candidate.userId === userId && candidate.isActive);
    const [account, setAccount] = useState<OperatorAccount | undefined>(() =>
        capabilities.isLanBrowser
            ? undefined
            : findAccount(window.localStorage.getItem(sessionStorageKey)),
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
            requestHostedApi<HostedSessionPayload | undefined>('/auth/session'),
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

    const persistAccounts = (nextAccounts: readonly OperatorAccount[]) => {
        if (!capabilities.isDemoMode && !capabilities.isLanBrowser && !window.vaultBillDesktop)
            window.localStorage.setItem(accountStorageKey, JSON.stringify(nextAccounts));
        setAccounts(nextAccounts);
    };

    const login = async (userId: string, password = '') => {
        let selectedAccount = findAccount(userId);

        if (!selectedAccount) {
            throw new Error('The selected operator account is unavailable.');
        }
        if (window.vaultBillDesktop && !capabilities.isDemoMode) {
            selectedAccount = await window.vaultBillDesktop.loginAccount(userId, password);
        } else if (capabilities.isLanBrowser) {
            const hostedSession = await requestHostedApi<HostedSessionPayload>(
                '/auth/login',
                'POST',
                {
                    userId,
                    password,
                },
            );
            selectedAccount = hostedSession.account;
            setHostedCsrfToken(hostedSession.csrfToken);
        } else if (selectedAccount.passwordHash) {
            const suppliedHash = await hashPassword(password);
            if (suppliedHash !== selectedAccount.passwordHash) {
                throw new Error('The password is incorrect.');
            }
        }

        window.localStorage.setItem(sessionStorageKey, selectedAccount.userId);
        setAccount(selectedAccount);
    };

    const logout = () => {
        if (capabilities.isLanBrowser) {
            void requestHostedApi('/auth/logout', 'POST').finally(() => {
                setHostedCsrfToken(undefined);
            });
        }
        window.localStorage.removeItem(sessionStorageKey);
        setAccount(undefined);
    };

    const saveAccount = async (nextAccount: OperatorAccount) => {
        const existing = accounts.find((candidate) => candidate.userId === nextAccount.userId);
        const nextAccounts = existing
            ? accounts.map((candidate) =>
                  candidate.userId === nextAccount.userId ? nextAccount : candidate,
              )
            : [...accounts, nextAccount];
        const validation = validateManagedAccounts(nextAccounts);
        if (validation) throw new Error(validation);
        if (window.vaultBillDesktop && !capabilities.isDemoMode) {
            const saved = await window.vaultBillDesktop.saveAccount(nextAccount);
            persistAccounts(
                nextAccounts.map((candidate) =>
                    candidate.userId === saved.userId ? saved : candidate,
                ),
            );
            return;
        }
        if (capabilities.isLanBrowser) {
            const saved = await requestHostedApi<OperatorAccount>(
                '/accounts/save',
                'POST',
                nextAccount,
            );
            persistAccounts(
                nextAccounts.map((candidate) =>
                    candidate.userId === saved.userId ? saved : candidate,
                ),
            );
            return;
        }
        persistAccounts(nextAccounts);
    };

    const archiveAccount = async (userId: string) => {
        if (userId === 'sysadmin_1') throw new Error('The System Administrator cannot be removed.');
        if (window.vaultBillDesktop && !capabilities.isDemoMode) {
            await window.vaultBillDesktop.archiveAccount(userId);
        } else if (capabilities.isLanBrowser) {
            await requestHostedApi('/accounts/archive', 'POST', { userId });
        }
        persistAccounts(
            accounts.map((candidate) =>
                candidate.userId === userId ? { ...candidate, isActive: false } : candidate,
            ),
        );
    };

    const resetPassword = async (userId: string, password: string) => {
        if (password.length < 8) throw new Error('Passwords must contain at least 8 characters.');
        if (window.vaultBillDesktop && !capabilities.isDemoMode) {
            const saved = await window.vaultBillDesktop.resetPassword(userId, password);
            persistAccounts(
                accounts.map((candidate) =>
                    candidate.userId === saved.userId ? saved : candidate,
                ),
            );
            return;
        }
        if (capabilities.isLanBrowser) {
            const saved = await requestHostedApi<OperatorAccount>(
                '/accounts/reset-password',
                'POST',
                {
                    userId,
                    password,
                },
            );
            persistAccounts(
                accounts.map((candidate) =>
                    candidate.userId === saved.userId ? saved : candidate,
                ),
            );
            if (account?.userId === saved.userId) setAccount(saved);
            return;
        }
        const passwordHash = await hashPassword(password);
        persistAccounts(
            accounts.map((candidate) =>
                candidate.userId === userId
                    ? {
                          ...candidate,
                          passwordHash,
                          usesDefaultPassword: passwordHash === defaultPasswordHash,
                      }
                    : candidate,
            ),
        );
    };

    return (
        <SessionContext.Provider
            value={{
                accounts,
                operatorContext: account ? createOperatorContext(account) : undefined,
                hostedConnectionState,
                login,
                logout,
                saveAccount,
                archiveAccount,
                resetPassword,
            }}
        >
            {children}
        </SessionContext.Provider>
    );
};

const hashPassword = async (password: string): Promise<string> => {
    const bytes = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
};

const validateManagedAccounts = (accounts: readonly OperatorAccount[]): string => {
    const active = accounts.filter((account) => account.isActive);
    if (active.filter((account) => account.role === 'SysAdmin').length !== 1) {
        return 'VaultBill requires exactly one active System Administrator.';
    }
    if (active.filter((account) => account.role === 'Admin').length > 1) {
        return 'VaultBill allows one active Administrator.';
    }
    if (active.filter((account) => account.role === 'User').length > 5) {
        return 'VaultBill allows up to five active Users.';
    }
    return '';
};

export const useSession = (): SessionContextValue => {
    const session = useContext(SessionContext);

    if (!session) {
        throw new Error('SessionProvider is required.');
    }

    return session;
};
