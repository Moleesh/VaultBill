import { createServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import { z } from 'zod';

import { getBuildIdentity } from '../BuildIdentity.js';
import type { DesktopRecordStore } from '../RecordStore.js';
import {
  canUseLocalApiAction,
  getLocalApiHost,
  isAllowedLocalApiOrigin,
  LocalApiConfigurationSchema,
  MAX_LOCAL_API_BODY_BYTES,
  type LocalApiConfiguration,
} from './LocalApiSecurity.js';
import type { LocalApiHealth } from './LocalApi.types.js';
import { tryServeStaticApp } from './StaticAppServer.js';

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

const OperatorHeaderSchema = z.object({
  role: z.enum(['SysAdmin', 'Admin', 'User']),
});

export class LocalApiServer {
  readonly #recordStore: DesktopRecordStore;
  readonly #staticDirectory: string;
  #configuration: LocalApiConfiguration;
  #server: Server | undefined;

  public constructor(
    recordStore: DesktopRecordStore,
    staticDirectory: string,
    configuration?: unknown,
  ) {
    this.#recordStore = recordStore;
    this.#staticDirectory = staticDirectory;
    this.#configuration = LocalApiConfigurationSchema.parse(configuration ?? {});
  }

  public start = async (): Promise<void> => {
    if (this.#server) return;
    this.#server = createServer((request, response) => {
      void this.#handle(request, response);
    });
    await new Promise<void>((resolve, reject) => {
      this.#server?.once('error', reject);
      this.#server?.listen(this.#configuration.port, getLocalApiHost(this.#configuration), resolve);
    });
  };

  public configure = async (configuration: unknown): Promise<LocalApiConfiguration> => {
    const next = LocalApiConfigurationSchema.parse(configuration);
    const needsRestart =
      next.lanEnabled !== this.#configuration.lanEnabled || next.port !== this.#configuration.port;
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

  async #handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
    response.setHeader('content-type', 'application/json');
    response.setHeader('x-content-type-options', 'nosniff');
    if (!isAllowedLocalApiOrigin(request.headers.origin, request.headers.host)) {
      this.#send(response, 403, { error: 'Origin is not allowed.' });
      return;
    }
    if (await tryServeStaticApp(request, response, this.#staticDirectory)) return;
    if (request.method === 'GET' && request.url === '/health') {
      this.#send(
        response,
        200,
        getLocalApiHealth(getBuildIdentity().appName, this.#configuration.passwordRequired),
      );
      return;
    }

    const operator = OperatorHeaderSchema.safeParse({
      role: request.headers['x-vaultbill-role'],
    });
    if (!operator.success) {
      this.#send(response, 401, { error: 'Operator context is required.' });
      return;
    }

    try {
      if (request.method === 'GET' && request.url === '/records') {
        this.#send(response, 200, this.#recordStore.list());
        return;
      }
      const body = await this.#readBody(request);
      const action =
        request.url === '/records/draft'
          ? 'saveDraft'
          : request.url === '/records/finalize'
            ? 'finalize'
            : request.url === '/records/cancel'
              ? 'cancel'
              : undefined;
      if (!action || !canUseLocalApiAction(operator.data.role, action)) {
        this.#send(response, 403, { error: 'Action is not allowed.' });
        return;
      }
      const result =
        action === 'saveDraft'
          ? this.#recordStore.saveDraft(body)
          : action === 'finalize'
            ? this.#recordStore.finalize(body)
            : this.#recordStore.cancel(body);
      this.#send(response, 200, result);
    } catch (error) {
      this.#send(response, 400, {
        error: error instanceof Error ? error.message : 'Invalid request.',
      });
    }
  }

  #readBody = async (request: IncomingMessage): Promise<unknown> => {
    const chunks: Uint8Array[] = [];
    let size = 0;
    for await (const chunk of request) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > MAX_LOCAL_API_BODY_BYTES) throw new Error('Request body is too large.');
      chunks.push(buffer);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  };

  #send = (response: ServerResponse, status: number, payload: unknown) => {
    response.writeHead(status);
    response.end(JSON.stringify(payload));
  };
}
