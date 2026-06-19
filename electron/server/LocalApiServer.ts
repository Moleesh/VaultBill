/** @format */

import { createServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';

import type { BuilderStore } from '../BuilderStore.js';
import type { CredentialStore } from '../CredentialStore.js';
import type { DesktopRecordStore } from '../RecordStore.js';
import type { SettingsStore } from '../SettingsStore.js';
import {
    fallbackHostedWebPort,
    getLocalApiHost,
    isAllowedLocalApiOrigin,
    LocalApiConfigurationSchema,
    type LocalApiConfiguration,
} from './LocalApiSecurity.js';
import { tryServeStaticApp } from './StaticAppServer.js';
import {
    ApiError,
    getSession,
    requireCsrf,
    type HostedSession,
    type LoginAttempts,
    type LocalApiDataOperations,
    type LocalApiState,
} from './LocalApiContext.js';
import { handleLocalApiAdminRoutes } from './LocalApiAdminRoutes.js';
import { handleLocalApiAuthRoutes } from './LocalApiAuthRoutes.js';
import { accountForSession } from './LocalApiAuthRoutesSupport.js';
import { handleLocalApiContentRoutes } from './LocalApiContentRoutes.js';

export { getLocalApiHealth } from './LocalApiAuthRoutes.js';

const localApiCorsHeaders = [
    'content-type',
    'x-vaultbill-csrf',
    'x-vaultbill-sysadmin-password',
    'x-vaultbill-backup-password',
    'x-vaultbill-recovery-key',
].join(', ');

/** Hosts the authenticated local API and the static app bundle. */
export class LocalApiServer {
    readonly #recordStore: DesktopRecordStore;
    readonly #credentialStore: CredentialStore;
    readonly #builderStore: BuilderStore;
    readonly #settingsStore: SettingsStore;
    readonly #staticDirectory: string;
    readonly #sessions = new Map<string, HostedSession>();
    readonly #loginAttempts = new Map<string, LoginAttempts>();
    readonly #dataOperations: LocalApiDataOperations | undefined;
    #configuration: LocalApiConfiguration;
    #server: Server | undefined;

    public constructor(
        recordStore: DesktopRecordStore,
        credentialStore: CredentialStore,
        builderStore: BuilderStore,
        settingsStore: SettingsStore,
        staticDirectory: string,
        configuration?: unknown,
        dataOperations?: LocalApiDataOperations,
    ) {
        this.#recordStore = recordStore;
        this.#credentialStore = credentialStore;
        this.#builderStore = builderStore;
        this.#settingsStore = settingsStore;
        this.#staticDirectory = staticDirectory;
        this.#configuration = LocalApiConfigurationSchema.parse(configuration ?? {});
        this.#dataOperations = dataOperations;
    }

    /** Starts the hosted API server and falls back to the backup port when the primary port is busy. */
    public start = async (): Promise<void> => {
        if (this.#server) return;
        const requestedPort = this.#configuration.port;
        const host = getLocalApiHost(this.#configuration);
        this.#server = createServer((request, response) => {
            void this.#handle(request, response).catch((error: unknown) => {
                this.#sendError(response, error);
            });
        });
        await new Promise<void>((resolve, reject) => {
            this.#server?.once('error', reject);
            this.#server?.listen(requestedPort, host, resolve);
        }).catch(async (error: unknown) => {
            const errorCode =
                error instanceof Error && 'code' in error
                    ? (error as Error & { readonly code?: string }).code
                    : undefined;
            if (requestedPort !== fallbackHostedWebPort && errorCode === 'EADDRINUSE') {
                this.#configuration = { ...this.#configuration, port: fallbackHostedWebPort };
                this.#server?.removeAllListeners('error');
                this.#server?.close();
                this.#server = undefined;
                await this.start();
                return;
            }
            throw error;
        });
    };

    /** Applies new hosted-web settings and restarts the server when host or port changes. */
    public configure = async (configuration: unknown): Promise<LocalApiConfiguration> => {
        const next = LocalApiConfigurationSchema.parse(configuration);
        const needsRestart =
            next.lanEnabled !== this.#configuration.lanEnabled ||
            next.port !== this.#configuration.port;
        this.#configuration = next;
        if (needsRestart) {
            await this.stop();
            await this.start();
        }
        console.info(
            `VaultBill LAN access ${next.lanEnabled ? 'enabled' : 'disabled'} on ${getLocalApiHost(next)}.`,
        );
        return next;
    };

    /** Returns the currently active hosted API configuration. */
    public getConfiguration = (): LocalApiConfiguration => this.#configuration;

    /** Stops the hosted API server without clearing the persisted configuration. */
    public stop = async (): Promise<void> => {
        const server = this.#server;
        this.#server = undefined;
        if (!server) return;
        await new Promise<void>((resolve, reject) => {
            server.close((error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    };

    /** Collects the current server dependencies for one request cycle. */
    #state = (): LocalApiState => ({
        recordStore: this.#recordStore,
        credentialStore: this.#credentialStore,
        builderStore: this.#builderStore,
        settingsStore: this.#settingsStore,
        staticDirectory: this.#staticDirectory,
        sessions: this.#sessions,
        loginAttempts: this.#loginAttempts,
        dataOperations: this.#dataOperations,
        configuration: this.#configuration,
    });

    /** Applies hosted-web CORS headers for a trusted browser origin. */
    #applyCorsHeaders = (response: ServerResponse, requestOrigin: string) => {
        response.setHeader('access-control-allow-origin', requestOrigin);
        response.setHeader('access-control-allow-credentials', 'true');
        response.setHeader('access-control-allow-headers', localApiCorsHeaders);
        response.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS');
        response.setHeader('vary', 'Origin');
    };

    /** Handles one hosted API or static-app request end to end. */
    async #handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
        response.setHeader('content-type', 'application/json');
        response.setHeader('x-content-type-options', 'nosniff');
        response.setHeader('cache-control', 'no-store');
        const requestOrigin = request.headers.origin;
        if (!isAllowedLocalApiOrigin(requestOrigin, request.headers.host)) {
            this.#send(response, 403, { error: 'Origin is not allowed.' });
            return;
        }
        if (requestOrigin) this.#applyCorsHeaders(response, requestOrigin);
        if (request.method === 'OPTIONS') {
            response.writeHead(204);
            response.end();
            return;
        }
        if (await tryServeStaticApp(request, response, this.#staticDirectory)) return;
        const state = this.#state();
        if (await handleLocalApiAuthRoutes(state, request, response)) return;
        const session = getSession(state, request);
        if (!session) {
            throw new ApiError(401, 'Log in to use the hosted VaultBill application.');
        }
        if (request.method === 'POST') requireCsrf(request, session);
        const account = accountForSession(state, session);
        if (await handleLocalApiAdminRoutes(state, account, request, response)) return;
        if (await handleLocalApiContentRoutes(state, account, request, response)) return;
        throw new ApiError(404, 'The hosted API route was not found.');
    }

    /** Sends one JSON response with the provided status code. */
    #send = (response: ServerResponse, status: number, payload: unknown) => {
        response.writeHead(status);
        response.end(JSON.stringify(payload));
    };

    /** Converts thrown request errors into consistent hosted API responses. */
    #sendError = (response: ServerResponse, error: unknown) => {
        if (response.headersSent || response.writableEnded) return;
        if (error instanceof ApiError) {
            this.#send(response, error.status, { error: error.message });
            return;
        }
        console.error('VaultBill hosted API request failed.', error);
        this.#send(response, 500, { error: 'The hosted API request could not be completed.' });
    };
}
