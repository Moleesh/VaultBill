/** @format */

import type { DesktopOperatorAccount } from '../CredentialStore.js';
import { ApiError, type HostedSession, type LocalApiState } from './LocalApiContext.js';

/** Loads one active operator account by id or rejects the hosted session. */
export const findAccount = (state: LocalApiState, userId: string): DesktopOperatorAccount => {
    const account = state.credentialStore
        .listAccounts()
        .find((candidate) => candidate.userId === userId && candidate.isActive);
    if (!account) throw new ApiError(401, 'The operator session is no longer active.');
    return account;
};

/** Resolves the visible account for an existing hosted session. */
export const accountForSession = (
    state: LocalApiState,
    session: HostedSession,
): DesktopOperatorAccount => findAccount(state, session.userId);

/** Returns the operator accounts visible to the current actor. */
export const accountsVisibleTo = (state: LocalApiState, account: DesktopOperatorAccount) => {
    const accounts = state.credentialStore.listAccounts();
    if (account.role === 'SysAdmin') return accounts;
    if (account.role === 'Admin') {
        return accounts.filter(
            (candidate) => candidate.userId === account.userId || candidate.role === 'User',
        );
    }
    return accounts.filter((candidate) => candidate.userId === account.userId);
};

/** Verifies whether one operator may manage another operator account. */
export const assertCanManage = (
    actor: DesktopOperatorAccount,
    targetRole: DesktopOperatorAccount['role'],
    targetUserId: string,
) => {
    if (targetUserId === 'sysadmin_1' || targetRole === 'SysAdmin') {
        throw new ApiError(403, 'The protected System Administrator cannot be managed here.');
    }
    if (actor.role === 'SysAdmin') return;
    if (actor.role === 'Admin' && targetRole === 'User') return;
    throw new ApiError(403, 'You cannot manage this operator account.');
};

/** Verifies whether one operator may reset the target operator password. */
export const assertCanResetPassword = (
    actor: DesktopOperatorAccount,
    target: DesktopOperatorAccount,
) => {
    if (actor.userId === target.userId) return;
    if (actor.role === 'SysAdmin') return;
    if (actor.role === 'Admin' && target.role === 'User') return;
    throw new ApiError(403, 'You cannot reset this operator password.');
};
