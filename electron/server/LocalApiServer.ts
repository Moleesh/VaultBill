/* eslint-disable max-lines */
import { createServer } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import { z } from 'zod';

import type { CredentialStore, DesktopOperatorAccount } from '../CredentialStore.js';
import type { BuilderStore } from '../BuilderStore.js';
import { getBuildIdentity } from '../BuildIdentity.js';
import type { DesktopRecordStore } from '../RecordStore.js';
import { cancelOutputJob, printHtmlWithElectron } from '../PrintBridge.js';
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
const sessionCookieName = 'vaultbill_session';
const sessionLifetimeMs = 8 * 60 * 60 * 1000;
const loginWindowMs = 5 * 60 * 1000;
const maxLoginAttempts = 5;

type HostedSession = {
  readonly sessionId: string;
  readonly csrfToken: string;
  readonly userId: string;
  expiresAt: number;
};

type LoginAttempts = {
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
};

export class LocalApiServer {
  readonly #recordStore: DesktopRecordStore;
  readonly #credentialStore: CredentialStore;
  readonly #builderStore: BuilderStore;
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
    staticDirectory: string,
    configuration?: unknown,
    dataOperations?: LocalApiDataOperations,
  ) {
    this.#recordStore = recordStore;
    this.#credentialStore = credentialStore;
    this.#builderStore = builderStore;
    this.#staticDirectory = staticDirectory;
    this.#configuration = LocalApiConfigurationSchema.parse(configuration ?? {});
    this.#dataOperations = dataOperations;
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
    response.setHeader('cache-control', 'no-store');
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

    try {
      if (request.method === 'GET' && request.url === '/auth/accounts') {
        this.#send(
          response,
          200,
          this.#credentialStore.listAccounts().filter((account) => account.isActive),
        );
        return;
      }
      if (request.method === 'POST' && request.url === '/auth/login') {
        await this.#login(request, response);
        return;
      }

      const session = this.#getSession(request);
      if (request.method === 'GET' && request.url === '/auth/session') {
        if (!session) {
          response.writeHead(204);
          response.end();
          return;
        }
        this.#send(response, 200, {
          account: this.#accountForSession(session),
          csrfToken: session.csrfToken,
        });
        return;
      }
      if (request.method === 'POST' && request.url === '/auth/logout') {
        if (session) {
          this.#requireCsrf(request, session);
          this.#sessions.delete(session.sessionId);
        }
        this.#clearSessionCookie(response);
        response.writeHead(204);
        response.end();
        return;
      }
      if (!session) {
        throw new ApiError(401, 'Log in to use the hosted VaultBill application.');
      }
      if (request.method === 'POST') this.#requireCsrf(request, session);
      const account = this.#accountForSession(session);

      if (request.method === 'GET' && request.url === '/credentials/status') {
        this.#requireSysAdmin(account);
        this.#send(response, 200, this.#requireDataOperations().getCredentialStatus());
        return;
      }
      if (request.method === 'GET' && request.url === '/trial/status') {
        this.#send(response, 200, this.#recordStore.checkpointTrial());
        return;
      }
      if (request.method === 'POST' && request.url === '/trial/activate') {
        const input = z
          .object({ licenseKey: z.string().trim().min(1) })
          .parse(await this.#readBody(request));
        this.#send(response, 200, this.#recordStore.activateLicense(input.licenseKey));
        return;
      }
      if (request.method === 'POST' && request.url === '/credentials/backup-password') {
        this.#requireSysAdmin(account);
        const input = z
          .object({
            currentPassword: z.string(),
            backupPassword: z.string().min(8),
          })
          .parse(await this.#readBody(request));
        this.#send(
          response,
          200,
          this.#requireDataOperations().setBackupPassword(
            input.currentPassword,
            input.backupPassword,
          ),
        );
        return;
      }
      if (request.method === 'POST' && request.url === '/backup/create') {
        this.#requireSysAdmin(account);
        this.#assertWritableTrial('create backups');
        const input = z
          .object({ encrypted: z.boolean(), currentPassword: z.string() })
          .parse(await this.#readBody(request));
        const archive = this.#requireDataOperations().createBackup(
          input.encrypted,
          input.currentPassword,
        );
        this.#sendArchive(response, archive);
        return;
      }
      if (request.method === 'POST' && request.url === '/backup/restore') {
        this.#requireSysAdmin(account);
        this.#assertWritableTrial('restore backups');
        const sysAdminPassword = decodeHeaderSecret(
          request.headers['x-vaultbill-sysadmin-password'],
        );
        const backupPassword = decodeHeaderSecret(request.headers['x-vaultbill-backup-password']);
        const recoveryKey = decodeHeaderSecret(request.headers['x-vaultbill-recovery-key']);
        const bytes = await this.#readRawBody(request);
        this.#requireDataOperations().restoreBackup(
          bytes,
          sysAdminPassword,
          backupPassword,
          recoveryKey,
        );
        this.#send(response, 202, { restarting: true });
        return;
      }
      if (request.method === 'POST' && request.url === '/application/reset') {
        this.#requireSysAdmin(account);
        const input = z
          .object({ currentPassword: z.string(), confirmation: z.string() })
          .parse(await this.#readBody(request));
        this.#requireDataOperations().resetApplicationData(
          input.currentPassword,
          input.confirmation,
        );
        this.#send(response, 202, { restarting: true });
        return;
      }
      if (request.method === 'GET' && request.url === '/settings/business') {
        this.#requireSysAdmin(account);
        this.#send(response, 200, this.#requireDataOperations().getBusinessSettings());
        return;
      }
      if (request.method === 'POST' && request.url === '/settings/business') {
        this.#requireSysAdmin(account);
        this.#send(
          response,
          200,
          this.#requireDataOperations().saveBusinessSettings(await this.#readBody(request)),
        );
        return;
      }
      if (request.method === 'GET' && request.url === '/settings/integrations') {
        this.#requireSysAdmin(account);
        this.#send(response, 200, this.#requireDataOperations().getIntegrationSettings());
        return;
      }
      if (request.method === 'POST' && request.url === '/settings/integrations') {
        this.#requireSysAdmin(account);
        if (this.#recordStore.getTrialStatus().isExpired) {
          throw new ApiError(
            403,
            'The trial is read-only. Enter a license key to configure integrations.',
          );
        }
        this.#send(
          response,
          200,
          this.#requireDataOperations().saveIntegrationSettings(await this.#readBody(request)),
        );
        return;
      }
      if (request.method === 'GET' && request.url === '/accounts') {
        this.#send(response, 200, this.#accountsVisibleTo(account));
        return;
      }
      if (request.method === 'POST' && request.url === '/accounts/save') {
        const input = ManagedAccountSchema.parse(await this.#readBody(request));
        this.#assertCanManage(account, input.role, input.userId);
        this.#send(response, 200, this.#credentialStore.saveAccount(input));
        return;
      }
      if (request.method === 'POST' && request.url === '/accounts/archive') {
        const input = AccountIdSchema.parse(await this.#readBody(request));
        const target = this.#findAccount(input.userId);
        this.#assertCanManage(account, target.role, target.userId);
        this.#credentialStore.archiveAccount(input.userId);
        response.writeHead(204);
        response.end();
        return;
      }
      if (request.method === 'POST' && request.url === '/accounts/reset-password') {
        const input = PasswordResetSchema.parse(await this.#readBody(request));
        const target = this.#findAccount(input.userId);
        this.#assertCanResetPassword(account, target);
        this.#send(
          response,
          200,
          this.#credentialStore.resetPassword(input.userId, input.password),
        );
        return;
      }
      if (request.method === 'GET' && request.url?.startsWith('/builder/package')) {
        if (account.role !== 'SysAdmin') {
          throw new ApiError(403, 'Only the System Administrator can use Builder.');
        }
        const formatId = new URL(request.url, 'http://local').searchParams.get('formatId');
        const builderPackage = this.#builderStore.load(formatId ?? undefined);
        if (!builderPackage) {
          response.writeHead(204);
          response.end();
          return;
        }
        this.#send(response, 200, builderPackage);
        return;
      }
      if (request.method === 'GET' && request.url === '/builder/inventory') {
        if (account.role !== 'SysAdmin') {
          throw new ApiError(403, 'Only the System Administrator can view Builder inventory.');
        }
        this.#send(response, 200, this.#builderStore.listInventory());
        return;
      }
      if (request.method === 'POST' && request.url === '/builder/package') {
        if (account.role !== 'SysAdmin') {
          throw new ApiError(403, 'Only the System Administrator can publish Builder formats.');
        }
        if (this.#recordStore.getTrialStatus().isExpired) {
          throw new ApiError(403, 'The trial is read-only. Enter a license key to use Builder.');
        }
        this.#send(response, 200, this.#builderStore.save(await this.#readBody(request)));
        return;
      }
      if (request.method === 'GET' && request.url?.startsWith('/print/template')) {
        const formatId = new URL(request.url, 'http://local').searchParams.get('formatId');
        const builderPackage = this.#builderStore.load(formatId ?? undefined);
        if (!builderPackage) {
          response.writeHead(204);
          response.end();
          return;
        }
        this.#send(response, 200, builderPackage);
        return;
      }
      if (request.method === 'GET' && request.url === '/print/formats') {
        this.#send(response, 200, this.#builderStore.listInventory());
        return;
      }
      if (request.method === 'POST' && request.url === '/print/html') {
        if (this.#recordStore.getTrialStatus().isExpired) {
          throw new ApiError(403, 'The trial is read-only. Enter a license key to print.');
        }
        this.#send(response, 200, await printHtmlWithElectron(await this.#readBody(request)));
        return;
      }
      if (request.method === 'POST' && request.url === '/print/cancel') {
        const input = z.object({ jobId: z.string().min(1) }).parse(await this.#readBody(request));
        this.#send(response, 200, { cancelled: cancelOutputJob(input.jobId) });
        return;
      }
      if (request.method === 'POST' && request.url === '/reports/query') {
        if (!canUseLocalApiAction(account.role, 'list')) {
          throw new ApiError(403, 'Reports are not available to this role.');
        }
        this.#send(response, 200, this.#recordStore.queryReport(await this.#readBody(request)));
        return;
      }

      if (request.method === 'GET' && request.url === '/records') {
        if (!canUseLocalApiAction(account.role, 'list')) {
          throw new ApiError(403, 'Records are not available to this role.');
        }
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
      if (!action) throw new ApiError(404, 'The hosted API route was not found.');
      if (!canUseLocalApiAction(account.role, action)) {
        throw new ApiError(403, 'Action is not allowed.');
      }
      if (this.#recordStore.getTrialStatus().isExpired) {
        throw new ApiError(403, 'The trial is read-only. Enter a license key to continue.');
      }
      const requestBody = asObject(body);
      const operatorContext = {
        account,
        role: account.role,
        CreatedBy: account.userId,
        CreatedByName: account.displayName,
        LastActionBy: account.userId,
        LastActionByName: account.displayName,
      };
      const securedBody = { ...requestBody, operatorContext };
      const result =
        action === 'saveDraft'
          ? this.#recordStore.saveDraft(securedBody)
          : action === 'finalize'
            ? this.#recordStore.finalize(securedBody)
            : this.#recordStore.cancel(securedBody);
      this.#send(response, 200, result);
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 400;
      this.#send(response, status, {
        error: error instanceof Error ? error.message : 'Invalid request.',
      });
    }
  }

  #login = async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    const input = LoginSchema.parse(await this.#readBody(request));
    const remoteAddress = request.socket.remoteAddress ?? 'unknown';
    const attemptKey = `${remoteAddress}:${input.userId}`;
    this.#assertLoginAllowed(attemptKey);

    try {
      const account = this.#credentialStore.authenticate(
        input.userId,
        input.password,
        isLoopbackAddress(remoteAddress),
      );
      this.#loginAttempts.delete(attemptKey);
      const session: HostedSession = {
        sessionId: randomBytes(32).toString('base64url'),
        csrfToken: randomBytes(32).toString('base64url'),
        userId: account.userId,
        expiresAt: Date.now() + sessionLifetimeMs,
      };
      this.#sessions.set(session.sessionId, session);
      response.setHeader(
        'set-cookie',
        `${sessionCookieName}=${session.sessionId}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${String(
          Math.floor(sessionLifetimeMs / 1000),
        )}`,
      );
      this.#send(response, 200, { account, csrfToken: session.csrfToken });
    } catch (error) {
      this.#recordFailedLogin(attemptKey);
      throw new ApiError(
        401,
        error instanceof Error ? error.message : 'The account could not be authenticated.',
      );
    }
  };

  #getSession = (request: IncomingMessage): HostedSession | undefined => {
    const sessionId = parseCookies(request.headers.cookie)[sessionCookieName];
    if (!sessionId) return undefined;
    const session = this.#sessions.get(sessionId);
    if (!session) return undefined;
    if (session.expiresAt <= Date.now()) {
      this.#sessions.delete(sessionId);
      return undefined;
    }
    session.expiresAt = Date.now() + sessionLifetimeMs;
    return session;
  };

  #accountForSession = (session: HostedSession): DesktopOperatorAccount =>
    this.#findAccount(session.userId);

  #findAccount = (userId: string): DesktopOperatorAccount => {
    const account = this.#credentialStore
      .listAccounts()
      .find((candidate) => candidate.userId === userId && candidate.isActive);
    if (!account) throw new ApiError(401, 'The operator session is no longer active.');
    return account;
  };

  #accountsVisibleTo = (account: DesktopOperatorAccount): readonly DesktopOperatorAccount[] => {
    const accounts = this.#credentialStore.listAccounts();
    if (account.role === 'SysAdmin') return accounts;
    if (account.role === 'Admin') {
      return accounts.filter(
        (candidate) => candidate.userId === account.userId || candidate.role === 'User',
      );
    }
    return accounts.filter((candidate) => candidate.userId === account.userId);
  };

  #assertCanManage = (
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

  #assertCanResetPassword = (actor: DesktopOperatorAccount, target: DesktopOperatorAccount) => {
    if (actor.userId === target.userId) return;
    if (actor.role === 'SysAdmin') return;
    if (actor.role === 'Admin' && target.role === 'User') return;
    throw new ApiError(403, 'You cannot reset this operator password.');
  };

  #requireSysAdmin = (account: DesktopOperatorAccount) => {
    if (account.role !== 'SysAdmin') {
      throw new ApiError(403, 'Only the System Administrator can perform this operation.');
    }
  };

  #requireDataOperations = (): LocalApiDataOperations => {
    if (!this.#dataOperations) {
      throw new ApiError(503, 'Desktop data operations are not available.');
    }
    return this.#dataOperations;
  };

  #assertWritableTrial = (operation: string) => {
    if (this.#recordStore.getTrialStatus().isExpired) {
      throw new ApiError(403, `The trial is read-only. Enter a license key to ${operation}.`);
    }
  };

  #requireCsrf = (request: IncomingMessage, session: HostedSession) => {
    const supplied = request.headers['x-vaultbill-csrf'];
    if (typeof supplied !== 'string' || !safeEqual(supplied, session.csrfToken)) {
      throw new ApiError(403, 'The hosted request could not be verified. Refresh and try again.');
    }
  };

  #assertLoginAllowed = (key: string) => {
    const attempts = this.#loginAttempts.get(key);
    if (!attempts) return;
    const now = Date.now();
    if (attempts.blockedUntil > now) {
      throw new ApiError(429, 'Too many login attempts. Wait a few minutes and try again.');
    }
    if (now - attempts.firstAttemptAt > loginWindowMs) this.#loginAttempts.delete(key);
  };

  #recordFailedLogin = (key: string) => {
    const now = Date.now();
    const current = this.#loginAttempts.get(key);
    const attempts =
      !current || now - current.firstAttemptAt > loginWindowMs
        ? { count: 1, firstAttemptAt: now, blockedUntil: 0 }
        : { ...current, count: current.count + 1 };
    if (attempts.count >= maxLoginAttempts) attempts.blockedUntil = now + loginWindowMs;
    this.#loginAttempts.set(key, attempts);
  };

  #clearSessionCookie = (response: ServerResponse) => {
    response.setHeader(
      'set-cookie',
      `${sessionCookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`,
    );
  };

  #readBody = async (request: IncomingMessage): Promise<unknown> => {
    const body = await this.#readRawBody(request);
    const text = Buffer.from(body).toString('utf8');
    return text.length > 0 ? (JSON.parse(text) as unknown) : {};
  };

  #readRawBody = async (request: IncomingMessage): Promise<Uint8Array> => {
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

  #send = (response: ServerResponse, status: number, payload: unknown) => {
    response.writeHead(status);
    response.end(JSON.stringify(payload));
  };

  #sendArchive = (
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
}

class ApiError extends Error {
  public constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const parseCookies = (header: string | undefined): Readonly<Record<string, string>> =>
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

const safeEqual = (left: string, right: string): boolean => {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
};

const isLoopbackAddress = (address: string): boolean =>
  address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';

const decodeHeaderSecret = (value: string | string[] | undefined): string => {
  if (typeof value !== 'string' || value.length === 0) return '';
  try {
    return Buffer.from(value, 'base64').toString('utf8');
  } catch {
    throw new ApiError(400, 'A protected operation credential is invalid.');
  }
};

const asObject = (value: unknown): Readonly<Record<string, unknown>> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ApiError(400, 'A JSON object is required.');
  }
  return value as Readonly<Record<string, unknown>>;
};
