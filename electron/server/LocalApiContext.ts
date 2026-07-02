/** @format */

import type { IncomingMessage } from 'node:http';

import type { BuilderStore } from '../BuilderStore.js';
import type { CredentialStore, DesktopOperatorAccount } from '../CredentialStore.js';
import type { DesktopRecordStore } from '../RecordStore.js';
import type { SettingsStore } from '../SettingsStore.js';
import { ApiError, parseCookies, safeEqual } from './LocalApiHttp.js';
import type { LocalApiConfiguration } from './LocalApiSecurity.js';

export { ApiError } from './LocalApiHttp.js';

/** One authenticated hosted-web session tracked in server memory. */
export type HostedSession = {
    readonly sessionId: string;
    readonly csrfToken: string;
    readonly userId: string;
    expiresAt: number;
};

/** Rolling login-attempt counters used for basic local brute-force throttling. */
export type LoginAttempts = {
    count: number;
    firstAttemptAt: number;
    blockedUntil: number;
};

/** Desktop-only data operations exposed to hosted authenticated routes. */
export type LocalApiDataOperations = {
    readonly minimizeWindow?: () => void;
    readonly closeWindow?: () => void;
    readonly createBackup: (
        encrypted: boolean,
        sysAdminPassword: string,
    ) => {
        readonly bytes: Uint8Array;
        readonly fileName: string;
        readonly recoveryKey?: string;
    };
    readonly restoreBackup: (
        bytes: Uint8Array,
        sysAdminPassword: string,
        backupPassword?: string,
        recoveryKey?: string,
    ) => void;
    readonly resetApplicationData: (sysAdminPassword: string, confirmation: string) => void;
    readonly getCredentialStatus: () => {
        readonly sysAdminUsesDefaultPassword: boolean;
        readonly backupUsesDefaultPassword: boolean;
    };
    readonly setBackupPassword: (
        sysAdminPassword: string,
        backupPassword: string,
    ) => {
        readonly sysAdminUsesDefaultPassword: boolean;
        readonly backupUsesDefaultPassword: boolean;
    };
    readonly getBusinessSettings: () => unknown;
    readonly saveBusinessSettings: (input: unknown) => unknown;
    readonly getSecretsSettings: () => unknown;
    readonly saveSecretsSettings: (input: unknown) => unknown;
    readonly getIntegrationSettings?: () => unknown;
    readonly saveIntegrationSettings?: (input: unknown) => unknown;
    readonly printHtml?: (input: unknown) => Promise<{
        readonly success: boolean;
        readonly warning?: string;
    }>;
    readonly cancelPrint?: (jobId: string) => boolean;
};

/** Shared request context assembled for each hosted API request. */
export type LocalApiState = {
    readonly recordStore: DesktopRecordStore;
    readonly credentialStore: CredentialStore;
    readonly builderStore: BuilderStore;
    readonly settingsStore: SettingsStore;
    readonly staticDirectory: string;
    readonly sessions: Map<string, HostedSession>;
    readonly loginAttempts: Map<string, LoginAttempts>;
    readonly dataOperations: LocalApiDataOperations | undefined;
    configuration: LocalApiConfiguration;
};

const sessionCookieName = 'vaultbill_session';
const sessionLifetimeMs = 8 * 60 * 60 * 1000;
const loginWindowMs = 5 * 60 * 1000;
const maxLoginAttempts = 5;

/** Requires the desktop data-operations bridge before calling backup or reset flows. */
export const requireDataOperations = (state: LocalApiState): LocalApiDataOperations => {
    if (!state.dataOperations)
        throw new ApiError(503, 'Desktop data operations are not available.');
    return state.dataOperations;
};

/** Cookie name used for hosted authenticated sessions. */
export const sessionCookie = sessionCookieName;
/** Sliding hosted session lifetime in milliseconds. */
export const sessionLifetime = sessionLifetimeMs;
/** Login-attempt rolling window in milliseconds. */
export const loginWindow = loginWindowMs;
/** Maximum failed logins allowed inside one rolling window. */
export const maxLoginAttemptsPerWindow = maxLoginAttempts;

/** Rejects write operations once the desktop trial has become read-only. */
export const assertWritableTrial = (state: LocalApiState, operation: string) => {
    if (state.recordStore.getTrialStatus().isExpired) {
        throw new ApiError(403, `The trial is read-only. Enter a license key to ${operation}.`);
    }
};

/** Restricts an operation to the protected System Administrator account. */
export const requireSysAdmin = (account: DesktopOperatorAccount) => {
    if (account.role !== 'SysAdmin') {
        throw new ApiError(403, 'Only the System Administrator can perform this operation.');
    }
};

/** Verifies the hosted CSRF token header against the current session. */
export const requireCsrf = (request: IncomingMessage, session: HostedSession) => {
    const supplied = request.headers['x-vaultbill-csrf'];
    if (typeof supplied !== 'string' || !safeEqual(supplied, session.csrfToken)) {
        throw new ApiError(403, 'The hosted request could not be verified. Refresh and try again.');
    }
};

/** Resolves the current hosted session from cookies and refreshes its sliding expiry. */
export const getSession = (
    state: LocalApiState,
    request: IncomingMessage,
): HostedSession | undefined => {
    const sessionId = parseCookies(request.headers.cookie)[sessionCookieName];
    if (!sessionId) return undefined;
    const session = state.sessions.get(sessionId);
    if (!session) return undefined;
    if (session.expiresAt <= Date.now()) {
        state.sessions.delete(sessionId);
        return undefined;
    }
    session.expiresAt = Date.now() + sessionLifetimeMs;
    return session;
};

/** Records one failed login attempt and applies temporary blocking when needed. */
export const recordFailedLogin = (state: LocalApiState, key: string) => {
    const now = Date.now();
    const current = state.loginAttempts.get(key);
    const attempts =
        !current || now - current.firstAttemptAt > loginWindowMs
            ? { count: 1, firstAttemptAt: now, blockedUntil: 0 }
            : { ...current, count: current.count + 1 };
    if (attempts.count >= maxLoginAttempts) attempts.blockedUntil = now + loginWindowMs;
    state.loginAttempts.set(key, attempts);
};

/** Rejects login attempts that are currently inside the temporary block window. */
export const assertLoginAllowed = (state: LocalApiState, key: string) => {
    const attempts = state.loginAttempts.get(key);
    if (!attempts) return;
    const now = Date.now();
    if (attempts.blockedUntil > now) {
        throw new ApiError(429, 'Too many login attempts. Wait a few minutes and try again.');
    }
    if (now - attempts.firstAttemptAt > loginWindowMs) state.loginAttempts.delete(key);
};
