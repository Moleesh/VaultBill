/** @format */

import { timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

import type { BuilderStore } from '../BuilderStore.js';
import type { CredentialStore, DesktopOperatorAccount } from '../CredentialStore.js';
import type { DesktopRecordStore } from '../RecordStore.js';
import type { LocalApiConfiguration } from './LocalApiSecurity.js';
import { MAX_LOCAL_API_BODY_BYTES } from './LocalApiSecurity.js';

export type HostedSession = {
    readonly sessionId: string;
    readonly csrfToken: string;
    readonly userId: string;
    expiresAt: number;
};

export type LoginAttempts = {
    count: number;
    firstAttemptAt: number;
    blockedUntil: number;
};

export type LocalApiDataOperations = {
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
    readonly getIntegrationSettings: () => unknown;
    readonly saveIntegrationSettings: (input: unknown) => unknown;
    readonly printHtml?: (input: unknown) => Promise<{
        readonly success: boolean;
        readonly warning?: string;
    }>;
    readonly cancelPrint?: (jobId: string) => boolean;
};

export type LocalApiState = {
    readonly recordStore: DesktopRecordStore;
    readonly credentialStore: CredentialStore;
    readonly builderStore: BuilderStore;
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

export const parseCookies = (header: string | undefined): Readonly<Record<string, string>> =>
    Object.fromEntries(
        (header ?? '')
            .split(';')
            .map((part) => part.trim())
            .filter(Boolean)
            .map((part) => {
                const separator = part.indexOf('=');
                return separator < 0
                    ? [decodeURIComponent(part), '']
                    : [
                          decodeURIComponent(part.slice(0, separator)),
                          decodeURIComponent(part.slice(separator + 1)),
                      ];
            }),
    );

export const safeEqual = (left: string, right: string): boolean => {
    const leftBytes = Buffer.from(left);
    const rightBytes = Buffer.from(right);
    return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
};

export const isLoopbackAddress = (address: string): boolean =>
    address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';

export const decodeHeaderSecret = (value: string | string[] | undefined): string => {
    const current = Array.isArray(value) ? value[0] : value;
    if (!current) return '';
    return Buffer.from(current, 'base64').toString('utf8');
};

export const readRawBody = async (request: IncomingMessage): Promise<Uint8Array> => {
    const chunks: Uint8Array[] = [];
    let size = 0;
    for await (const chunk of request) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += buffer.length;
        if (size > MAX_LOCAL_API_BODY_BYTES) throw new ApiError(413, 'Request body is too large.');
        chunks.push(buffer);
    }
    return new Uint8Array(Buffer.concat(chunks));
};

export const readBody = async (request: IncomingMessage): Promise<unknown> => {
    const body = await readRawBody(request);
    const text = Buffer.from(body).toString('utf8');
    return text.length > 0 ? (JSON.parse(text) as unknown) : {};
};

export const sendJson = (response: ServerResponse, status: number, payload: unknown) => {
    response.writeHead(status);
    response.end(JSON.stringify(payload));
};

export const sendArchive = (
    response: ServerResponse,
    archive: {
        readonly bytes: Uint8Array;
        readonly fileName: string;
        readonly recoveryKey?: string;
    },
) => {
    response.writeHead(200, {
        'content-type': 'application/zip',
        'content-disposition': `attachment; filename="${archive.fileName.replaceAll('"', '')}"`,
        'content-length': archive.bytes.byteLength,
        ...(archive.recoveryKey ? { 'x-vaultbill-recovery-key': archive.recoveryKey } : {}),
    });
    response.end(Buffer.from(archive.bytes));
};

export const requireDataOperations = (state: LocalApiState): LocalApiDataOperations => {
    if (!state.dataOperations)
        throw new ApiError(503, 'Desktop data operations are not available.');
    return state.dataOperations;
};

export const sessionCookie = sessionCookieName;
export const sessionLifetime = sessionLifetimeMs;
export const loginWindow = loginWindowMs;
export const maxLoginAttemptsPerWindow = maxLoginAttempts;

export class ApiError extends Error {
    public constructor(
        public readonly status: number,
        message: string,
    ) {
        super(message);
    }
}

export const assertWritableTrial = (state: LocalApiState, operation: string) => {
    if (state.recordStore.getTrialStatus().isExpired) {
        throw new ApiError(403, `The trial is read-only. Enter a license key to ${operation}.`);
    }
};

export const requireSysAdmin = (account: DesktopOperatorAccount) => {
    if (account.role !== 'SysAdmin') {
        throw new ApiError(403, 'Only the System Administrator can perform this operation.');
    }
};

export const requireCsrf = (request: IncomingMessage, session: HostedSession) => {
    const supplied = request.headers['x-vaultbill-csrf'];
    if (typeof supplied !== 'string' || !safeEqual(supplied, session.csrfToken)) {
        throw new ApiError(403, 'The hosted request could not be verified. Refresh and try again.');
    }
};

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

export const assertLoginAllowed = (state: LocalApiState, key: string) => {
    const attempts = state.loginAttempts.get(key);
    if (!attempts) return;
    const now = Date.now();
    if (attempts.blockedUntil > now) {
        throw new ApiError(429, 'Too many login attempts. Wait a few minutes and try again.');
    }
    if (now - attempts.firstAttemptAt > loginWindowMs) state.loginAttempts.delete(key);
};
