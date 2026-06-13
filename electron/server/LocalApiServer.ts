/** @format */

import { createServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';

import type { BuilderStore } from '../BuilderStore.js';
import type { CredentialStore, DesktopOperatorAccount } from '../CredentialStore.js';
import type { DesktopRecordStore } from '../RecordStore.js';
import type { SettingsStore } from '../SettingsStore.js';
import {
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
import { handleLocalApiContentRoutes } from './LocalApiContentRoutes.js';

export { getLocalApiHealth } from './LocalApiAuthRoutes.js';

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

    public start = async (): Promise<void> => {
        if (this.#server) return;
        this.#server = createServer((request, response) => {
            void this.#handle(request, response).catch((error: unknown) => {
                this.#sendError(response, error);
            });
        });
        await new Promise<void>((resolve, reject) => {
            this.#server?.once('error', reject);
            this.#server?.listen(
                this.#configuration.port,
                getLocalApiHost(this.#configuration),
                resolve,
            );
        });
    };

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

    async #handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
        response.setHeader('content-type', 'application/json');
        response.setHeader('x-content-type-options', 'nosniff');
        response.setHeader('cache-control', 'no-store');
        if (!isAllowedLocalApiOrigin(request.headers.origin, request.headers.host)) {
            this.#send(response, 403, { error: 'Origin is not allowed.' });
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
        const account = this.#accountForSession(state, session);
        if (await handleLocalApiAdminRoutes(state, account, request, response)) return;
        if (await handleLocalApiContentRoutes(state, account, request, response)) return;
        throw new ApiError(404, 'The hosted API route was not found.');
    }

    #accountForSession = (
        state: LocalApiState,
        session: NonNullable<ReturnType<typeof getSession>>,
    ) => this.#findAccount(state, session.userId);

    #findAccount = (state: LocalApiState, userId: string): DesktopOperatorAccount => {
        const account = state.credentialStore
            .listAccounts()
            .find((candidate) => candidate.userId === userId && candidate.isActive);
        if (!account) throw new ApiError(401, 'The operator session is no longer active.');
        return account;
    };

    #send = (response: ServerResponse, status: number, payload: unknown) => {
        response.writeHead(status);
        response.end(JSON.stringify(payload));
    };

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
