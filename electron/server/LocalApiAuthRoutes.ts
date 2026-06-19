/** @format */

import { randomBytes } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { z } from 'zod';

import { getBuildIdentity } from '../BuildIdentity.js';
import { isLoopbackAddress, readBody, sendJson } from './LocalApiHttp.js';
import {
    ApiError,
    assertLoginAllowed,
    getSession,
    recordFailedLogin,
    requireCsrf,
    sessionCookie,
    sessionLifetime,
    type HostedSession,
    type LocalApiState,
} from './LocalApiContext.js';
import type { LocalApiHealth } from './LocalApi.types.js';
import {
    accountForSession,
    accountsVisibleTo,
    assertCanManage,
    assertCanResetPassword,
    findAccount,
} from './LocalApiAuthRoutesSupport.js';
import { completeSetup, readSetupStatus } from '../SetupSupport.js';

const LoginSchema = z.object({
    userId: z.string().min(1),
    password: z.string(),
});
const ManagedAccountSchema = z.object({
    userId: z.string().min(1),
    username: z.string().trim().min(1),
    displayName: z.string().trim().min(1),
    role: z.enum(['SysAdmin', 'Admin', 'User']),
    isActive: z.boolean(),
});
const AccountIdSchema = z.object({ userId: z.string().min(1) });
const PasswordResetSchema = AccountIdSchema.extend({ password: z.string().min(8) });

/** Returns the local API health payload shown to hosted-web clients. */
export const getLocalApiHealth = (appName: string, passwordRequired = true): LocalApiHealth => ({
    appName,
    capabilities: [
        'AccountContext',
        'DocumentFormats',
        'Records',
        'PrintPreview',
        'Reports',
        'BulkImport',
        'BackupCapability',
    ],
    status: 'Ready',
    passwordRequired,
});

/** Handles authentication and account-management routes. */
export const handleLocalApiAuthRoutes = async (
    state: LocalApiState,
    request: IncomingMessage,
    response: ServerResponse,
): Promise<boolean> => {
    if (request.method === 'GET' && request.url === '/health') {
        sendJson(
            response,
            200,
            getLocalApiHealth(getBuildIdentity().appName, state.configuration.passwordRequired),
        );
        return true;
    }
    if (request.method === 'GET' && request.url === '/auth/accounts') {
        sendJson(
            response,
            200,
            state.credentialStore.listAccounts().filter((account) => account.isActive),
        );
        return true;
    }
    if (request.method === 'GET' && request.url === '/setup/status') {
        sendJson(response, 200, readSetupStatus(state.credentialStore, state.settingsStore));
        return true;
    }
    if (request.method === 'POST' && request.url === '/setup/complete') {
        completeSetup(state.credentialStore, state.settingsStore, await readBody(request));
        sendJson(response, 200, readSetupStatus(state.credentialStore, state.settingsStore));
        return true;
    }
    if (request.method === 'POST' && request.url === '/auth/login') {
        const input = LoginSchema.parse(await readBody(request));
        const remoteAddress = request.socket.remoteAddress ?? 'unknown';
        const attemptKey = `${remoteAddress}:${input.userId}`;
        assertLoginAllowed(state, attemptKey);
        try {
            const account = state.credentialStore.authenticate(
                input.userId,
                input.password,
                isLoopbackAddress(remoteAddress),
            );
            state.loginAttempts.delete(attemptKey);
            const session: HostedSession = {
                sessionId: randomBytes(32).toString('base64url'),
                csrfToken: randomBytes(32).toString('base64url'),
                userId: account.userId,
                expiresAt: Date.now() + sessionLifetime,
            };
            state.sessions.set(session.sessionId, session);
            response.setHeader(
                'set-cookie',
                `${sessionCookie}=${session.sessionId}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${String(
                    Math.floor(sessionLifetime / 1000),
                )}`,
            );
            sendJson(response, 200, { account, csrfToken: session.csrfToken });
        } catch (error) {
            recordFailedLogin(state, attemptKey);
            throw new ApiError(
                401,
                error instanceof Error ? error.message : 'The account could not be authenticated.',
            );
        }
        return true;
    }

    const session = getSession(state, request);
    if (request.method === 'GET' && request.url === '/auth/session') {
        if (!session) {
            response.writeHead(204);
            response.end();
            return true;
        }
        sendJson(response, 200, {
            account: accountForSession(state, session),
            csrfToken: session.csrfToken,
        });
        return true;
    }
    if (request.method === 'POST' && request.url === '/auth/logout') {
        if (session) {
            requireCsrf(request, session);
            state.sessions.delete(session.sessionId);
        }
        response.setHeader(
            'set-cookie',
            `${sessionCookie}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`,
        );
        response.writeHead(204);
        response.end();
        return true;
    }
    if (!session) return false;
    if (request.method === 'POST') requireCsrf(request, session);
    const account = accountForSession(state, session);

    if (request.method === 'GET' && request.url === '/workspace/settings') {
        sendJson(response, 200, state.settingsStore.getBusiness());
        return true;
    }

    if (request.method === 'GET' && request.url === '/accounts') {
        sendJson(response, 200, accountsVisibleTo(state, account));
        return true;
    }
    if (request.method === 'POST' && request.url === '/accounts/save') {
        const input = ManagedAccountSchema.parse(await readBody(request));
        assertCanManage(account, input.role, input.userId);
        sendJson(response, 200, state.credentialStore.saveAccount(input));
        return true;
    }
    if (request.method === 'POST' && request.url === '/accounts/archive') {
        const input = AccountIdSchema.parse(await readBody(request));
        const target = findAccount(state, input.userId);
        assertCanManage(account, target.role, target.userId);
        state.credentialStore.archiveAccount(input.userId);
        response.writeHead(204);
        response.end();
        return true;
    }
    if (request.method === 'POST' && request.url === '/accounts/reset-password') {
        const input = PasswordResetSchema.parse(await readBody(request));
        const target = findAccount(state, input.userId);
        assertCanResetPassword(account, target);
        sendJson(response, 200, state.credentialStore.resetPassword(input.userId, input.password));
        return true;
    }

    return false;
};
