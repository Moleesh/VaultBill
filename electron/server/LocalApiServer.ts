/** @format */

import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import { createServer } from 'node:http';

import type { BuilderStore } from '../BuilderStore.js';
import type { CredentialStore } from '../CredentialStore.js';
import type { DesktopRecordStore } from '../RecordStore.js';
import type { SettingsStore } from '../SettingsStore.js';
import { handleLocalApiAdminRoutes } from './LocalApiAdminRoutes.js';
import { handleLocalApiAuthRoutes } from './LocalApiAuthRoutes.js';
import { accountForSession } from './LocalApiAuthRoutesSupport.js';
import { handleLocalApiContentRoutes } from './LocalApiContentRoutes.js';
import type { HostedSession, LoginAttempts } from './LocalApiContext.js';
import {
    ApiError,
    getSession,
    requireCsrf,
    type LocalApiDataOperations,
} from './LocalApiContext.js';
import {
    fallbackHostedWebPort,
    getLocalApiHost,
    LocalApiConfigurationSchema,
    type LocalApiConfiguration,
} from './LocalApiSecurity.js';
import {
    applyLocalApiCorsHeaders,
    buildLocalApiLanMessage,
    createLocalApiState,
    guardAllowedLocalApiOrigin,
    sendHostedAccessDisabled,
    sendLocalApiError,
} from './LocalApiServerSupport.js';
import { tryServeStaticApp } from './StaticAppServer.js';
export { getLocalApiHealth } from './LocalApiHealthSupport.js';

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
    #hostedAccessEnabled: boolean;

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
        this.#hostedAccessEnabled = this.#configuration.autoStart;
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
        console.info(buildLocalApiLanMessage(next));
        return next;
    };

    /** Returns the currently active hosted API configuration. */
    public getConfiguration = (): LocalApiConfiguration => this.#configuration;

    /** Reports whether hosted browser access is currently enabled. */
    public isHostedAccessEnabled = (): boolean => this.#hostedAccessEnabled;

    /** Enables the hosted browser access layer without changing the listening server. */
    public startHostedAccess = (): void => {
        this.#hostedAccessEnabled = true;
    };

    /** Disables hosted browser access and clears active hosted sessions. */
    public stopHostedAccess = (): void => {
        this.#hostedAccessEnabled = false;
        this.#sessions.clear();
        this.#loginAttempts.clear();
    };

    /** Restarts hosted browser access and clears active hosted sessions. */
    public restartHostedAccess = (): void => {
        this.stopHostedAccess();
        this.startHostedAccess();
    };

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

    /** Handles one hosted API or static-app request end to end. */
    async #handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
        response.setHeader('content-type', 'application/json');
        response.setHeader('x-content-type-options', 'nosniff');
        response.setHeader('cache-control', 'no-store');
        const requestOrigin = request.headers.origin;
        if (!guardAllowedLocalApiOrigin(request, response)) return;
        if (requestOrigin) applyLocalApiCorsHeaders(response, requestOrigin);
        if (request.method === 'OPTIONS') {
            response.writeHead(204);
            response.end();
            return;
        }
        if (await tryServeStaticApp(request, response, this.#staticDirectory)) return;
        if (!this.#hostedAccessEnabled) {
            sendHostedAccessDisabled(request, response);
            return;
        }
        const state = createLocalApiState({
            builderStore: this.#builderStore,
            configuration: this.#configuration,
            credentialStore: this.#credentialStore,
            dataOperations: this.#dataOperations,
            loginAttempts: this.#loginAttempts,
            recordStore: this.#recordStore,
            sessions: this.#sessions,
            settingsStore: this.#settingsStore,
            staticDirectory: this.#staticDirectory,
        });
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

    /** Converts thrown request errors into consistent hosted API responses. */
    #sendError = (response: ServerResponse, error: unknown) => {
        sendLocalApiError(response, error);
    };
}
