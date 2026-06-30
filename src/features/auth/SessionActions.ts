/** @format */

import type { OperatorAccount } from './AccountTypes';
import type { SessionContextValue } from './SessionTypes';
import { requestHostedApi } from '../../runtime/HostedApi';
import {
    defaultPasswordHash,
    hashPassword,
    fallbackBrowserAccounts,
    type HostedSessionPayload,
    validateManagedAccounts,
} from './SessionSupport';

type SessionActionDependencies = {
    readonly accounts: () => readonly OperatorAccount[];
    readonly account: () => OperatorAccount | undefined;
    readonly canUseHostedSessionApi: () => boolean;
    readonly usesStaticHostedBrowserBuild: () => boolean;
    readonly saveAccounts: (accounts: readonly OperatorAccount[]) => void;
    readonly setAccount: (account: OperatorAccount | undefined) => void;
    readonly setHostedCsrfToken: (token: string | undefined) => void;
};

/**
 * Creates session actions that always read the latest state via callbacks.
 */
export const createSessionActions = (dependencies: SessionActionDependencies) => {
    const persistAccounts = (nextAccounts: readonly OperatorAccount[]) => {
        dependencies.saveAccounts(nextAccounts);
    };

    const findAccount = (userId: string | null): OperatorAccount | undefined =>
        dependencies
            .accounts()
            .find((candidate) => candidate.userId === userId && candidate.isActive);

    const login: SessionContextValue['login'] = async (userId, password = '') => {
        let selectedAccount = findAccount(userId);

        if (!selectedAccount) {
            throw new Error('The selected operator account is unavailable.');
        }
        if (window.vaultBillDesktop) {
            selectedAccount = await window.vaultBillDesktop.loginAccount(userId, password);
        } else if (dependencies.canUseHostedSessionApi()) {
            const hostedSession = await requestHostedApi<HostedSessionPayload>(
                '/auth/login',
                'POST',
                {
                    userId,
                    password,
                },
            );
            selectedAccount = hostedSession.account;
            dependencies.setHostedCsrfToken(hostedSession.csrfToken);
        } else if (selectedAccount.passwordHash) {
            const suppliedHash = await hashPassword(password);
            if (suppliedHash !== selectedAccount.passwordHash) {
                throw new Error('The password is incorrect.');
            }
        }

        dependencies.setAccount(selectedAccount);
    };

    const logout: SessionContextValue['logout'] = () => {
        if (dependencies.canUseHostedSessionApi()) {
            void requestHostedApi('/auth/logout', 'POST').finally(() => {
                dependencies.setHostedCsrfToken(undefined);
            });
        }
        dependencies.setAccount(undefined);
    };

    const saveAccount: SessionContextValue['saveAccount'] = async (nextAccount) => {
        const accounts = dependencies.accounts();
        const existing = accounts.find((candidate) => candidate.userId === nextAccount.userId);
        const baseAccounts = accounts.length > 0 ? accounts : fallbackBrowserAccounts;
        const nextAccounts = existing
            ? baseAccounts.map((candidate) =>
                  candidate.userId === nextAccount.userId ? nextAccount : candidate,
              )
            : [...baseAccounts, nextAccount];
        const validation = validateManagedAccounts(nextAccounts);
        if (validation) throw new Error(validation);
        if (window.vaultBillDesktop) {
            const saved = await window.vaultBillDesktop.saveAccount(nextAccount);
            persistAccounts(
                nextAccounts.map((candidate) =>
                    candidate.userId === saved.userId ? saved : candidate,
                ),
            );
            return;
        }
        if (dependencies.canUseHostedSessionApi()) {
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

    const archiveAccount: SessionContextValue['archiveAccount'] = async (userId) => {
        if (userId === 'sysadmin_1') throw new Error('The System Administrator cannot be removed.');
        if (window.vaultBillDesktop) {
            await window.vaultBillDesktop.archiveAccount(userId);
        } else if (dependencies.canUseHostedSessionApi()) {
            await requestHostedApi('/accounts/archive', 'POST', { userId });
        }
        persistAccounts(
            dependencies
                .accounts()
                .map((candidate) =>
                    candidate.userId === userId ? { ...candidate, isActive: false } : candidate,
                ),
        );
    };

    const resetPassword: SessionContextValue['resetPassword'] = async (userId, password) => {
        if (password.length < 8) throw new Error('Passwords must contain at least 8 characters.');
        if (window.vaultBillDesktop) {
            const saved = await window.vaultBillDesktop.resetPassword(userId, password);
            persistAccounts(
                dependencies
                    .accounts()
                    .map((candidate) => (candidate.userId === saved.userId ? saved : candidate)),
            );
            return;
        }
        if (dependencies.canUseHostedSessionApi()) {
            const saved = await requestHostedApi<OperatorAccount>(
                '/accounts/reset-password',
                'POST',
                {
                    userId,
                    password,
                },
            );
            persistAccounts(
                dependencies
                    .accounts()
                    .map((candidate) => (candidate.userId === saved.userId ? saved : candidate)),
            );
            if (dependencies.account()?.userId === saved.userId) dependencies.setAccount(saved);
            return;
        }
        if (!dependencies.usesStaticHostedBrowserBuild()) return;

        const passwordHash = await hashPassword(password);
        persistAccounts(
            dependencies.accounts().map((candidate) =>
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

    return { login, logout, saveAccount, archiveAccount, resetPassword };
};
