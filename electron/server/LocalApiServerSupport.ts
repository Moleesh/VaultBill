/** @format */

import type { IncomingMessage, ServerResponse } from 'node:http';

import type { BuilderStore } from '../BuilderStore.js';
import type { CredentialStore } from '../CredentialStore.js';
import type { DesktopRecordStore } from '../RecordStore.js';
import type { SettingsStore } from '../SettingsStore.js';
import {
    ApiError,
    type HostedSession,
    type LocalApiDataOperations,
    type LocalApiState,
    type LoginAttempts,
} from './LocalApiContext.js';
import {
    getLocalApiHost,
    isAllowedLocalApiOrigin,
    type LocalApiConfiguration,
} from './LocalApiSecurity.js';

export const localApiCorsHeaders = [
    'content-type',
    'x-vaultbill-csrf',
    'x-vaultbill-backup-password',
    'x-vaultbill-recovery-key',
].join(', ');

/** Builds the shared per-request API state bag. */
export const createLocalApiState = (input: {
    readonly builderStore: BuilderStore;
    readonly configuration: LocalApiConfiguration;
    readonly credentialStore: CredentialStore;
    readonly dataOperations: LocalApiDataOperations | undefined;
    readonly loginAttempts: Map<string, LoginAttempts>;
    readonly recordStore: DesktopRecordStore;
    readonly sessions: Map<string, HostedSession>;
    readonly settingsStore: SettingsStore;
    readonly staticDirectory: string;
}): LocalApiState => ({
    builderStore: input.builderStore,
    configuration: input.configuration,
    credentialStore: input.credentialStore,
    dataOperations: input.dataOperations,
    loginAttempts: input.loginAttempts,
    recordStore: input.recordStore,
    sessions: input.sessions,
    settingsStore: input.settingsStore,
    staticDirectory: input.staticDirectory,
});

/** Applies CORS headers for one trusted hosted-browser request. */
export const applyLocalApiCorsHeaders = (response: ServerResponse, requestOrigin: string): void => {
    response.setHeader('access-control-allow-origin', requestOrigin);
    response.setHeader('access-control-allow-credentials', 'true');
    response.setHeader('access-control-allow-headers', localApiCorsHeaders);
    response.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS');
    response.setHeader('vary', 'Origin');
};

/** Returns true when a request origin is allowed and sends 403 otherwise. */
export const guardAllowedLocalApiOrigin = (
    request: IncomingMessage,
    response: ServerResponse,
): boolean => {
    if (isAllowedLocalApiOrigin(request.headers.origin, request.headers.host)) return true;
    sendJsonResponse(response, 403, { error: 'Origin is not allowed.' });
    return false;
};

/** Sends one stable hosted-access disabled response. */
export const sendHostedAccessDisabled = (
    request: IncomingMessage,
    response: ServerResponse,
): void => {
    sendJsonResponse(
        response,
        request.url === '/health' ? 503 : 423,
        request.url === '/health'
            ? { error: 'Hosted web access is currently stopped.' }
            : { error: 'Hosted web access is currently stopped on the desktop host.' },
    );
};

/** Sends one JSON payload with the given status. */
export const sendJsonResponse = (
    response: ServerResponse,
    status: number,
    payload: unknown,
): void => {
    response.writeHead(status);
    response.end(JSON.stringify(payload));
};

/** Converts thrown API errors into consistent hosted responses. */
export const sendLocalApiError = (response: ServerResponse, error: unknown): void => {
    if (response.headersSent || response.writableEnded) return;
    if (error instanceof ApiError) {
        sendJsonResponse(response, error.status, { error: error.message });
        return;
    }
    console.error('VaultBill hosted API request failed.', error);
    sendJsonResponse(response, 500, { error: 'The hosted API request could not be completed.' });
};

/** Formats one LAN-access change message for server logs. */
export const buildLocalApiLanMessage = (configuration: LocalApiConfiguration): string =>
    `VaultBill LAN access ${configuration.lanEnabled ? 'enabled' : 'disabled'} on ${getLocalApiHost(configuration)}.`;
