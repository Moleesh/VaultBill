/** @format */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { z } from 'zod';

import type { DesktopOperatorAccount } from '../CredentialStore.js';
import type { LocalApiDataOperations, LocalApiState } from './LocalApiContext.js';
import {
    decodeHeaderSecret,
    readBody,
    readRawBody,
    sendArchive,
    sendJson,
} from './LocalApiHttp.js';
import {
    ApiError,
    assertWritableTrial,
    requireDataOperations,
    requireSysAdmin,
} from './LocalApiContext.js';

/** Restricts an admin route to the protected System Administrator account. */
const requireSysAdminAccess = (account: DesktopOperatorAccount) => {
    requireSysAdmin(account);
};

/** Resolves the desktop-only data bridge used by admin routes. */
const getDataOperations = (state: LocalApiState): LocalApiDataOperations =>
    requireDataOperations(state);

/** Handles business, security, trial, backup, and secrets routes. */
export const handleLocalApiAdminRoutes = async (
    state: LocalApiState,
    account: DesktopOperatorAccount,
    request: IncomingMessage,
    response: ServerResponse,
): Promise<boolean> => {
    if (request.method === 'GET' && request.url === '/credentials/status') {
        requireSysAdminAccess(account);
        sendJson(response, 200, getDataOperations(state).getCredentialStatus());
        return true;
    }
    if (request.method === 'GET' && request.url === '/trial/status') {
        sendJson(response, 200, state.recordStore.checkpointTrial());
        return true;
    }
    if (request.method === 'POST' && request.url === '/trial/activate') {
        const input = z
            .object({ licenseKey: z.string().trim().min(1) })
            .parse(await readBody(request));
        sendJson(response, 200, state.recordStore.activateLicense(input.licenseKey));
        return true;
    }
    if (request.method === 'POST' && request.url === '/credentials/backup-password') {
        requireSysAdminAccess(account);
        const input = z
            .object({
                currentPassword: z.string(),
                backupPassword: z.string().min(8),
            })
            .parse(await readBody(request));
        sendJson(
            response,
            200,
            getDataOperations(state).setBackupPassword(input.currentPassword, input.backupPassword),
        );
        return true;
    }
    if (request.method === 'POST' && request.url === '/backup/create') {
        requireSysAdminAccess(account);
        assertWritableTrial(state, 'create backups');
        const input = z
            .object({ encrypted: z.boolean(), currentPassword: z.string() })
            .parse(await readBody(request));
        sendArchive(
            response,
            getDataOperations(state).createBackup(input.encrypted, input.currentPassword),
        );
        return true;
    }
    if (request.method === 'GET' && request.url === '/backup/status') {
        requireSysAdminAccess(account);
        sendJson(response, 200, state.settingsStore.getBackupMetadata());
        return true;
    }
    if (request.method === 'POST' && request.url === '/backup/restore') {
        requireSysAdminAccess(account);
        assertWritableTrial(state, 'restore backups');
        const sysAdminPassword = decodeHeaderSecret(
            request.headers['x-vaultbill-sysadmin-password'],
        );
        const backupPassword = decodeHeaderSecret(request.headers['x-vaultbill-backup-password']);
        const recoveryKey = decodeHeaderSecret(request.headers['x-vaultbill-recovery-key']);
        const bytes = await readRawBody(request);
        getDataOperations(state).restoreBackup(
            bytes,
            sysAdminPassword,
            backupPassword,
            recoveryKey,
        );
        sendJson(response, 202, { restarting: true });
        return true;
    }
    if (request.method === 'POST' && request.url === '/application/reset') {
        requireSysAdminAccess(account);
        const input = z
            .object({ currentPassword: z.string(), confirmation: z.string() })
            .parse(await readBody(request));
        getDataOperations(state).resetApplicationData(input.currentPassword, input.confirmation);
        sendJson(response, 202, { restarting: true });
        return true;
    }
    if (request.method === 'GET' && request.url === '/settings/business') {
        requireSysAdminAccess(account);
        sendJson(response, 200, getDataOperations(state).getBusinessSettings());
        return true;
    }
    if (request.method === 'POST' && request.url === '/settings/business') {
        requireSysAdminAccess(account);
        sendJson(
            response,
            200,
            getDataOperations(state).saveBusinessSettings(await readBody(request)),
        );
        return true;
    }
    if (
        request.method === 'GET' &&
        (request.url === '/settings/secrets' || request.url === '/settings/integrations')
    ) {
        requireSysAdminAccess(account);
        sendJson(response, 200, getDataOperations(state).getSecretsSettings());
        return true;
    }
    if (
        request.method === 'POST' &&
        (request.url === '/settings/secrets' || request.url === '/settings/integrations')
    ) {
        requireSysAdminAccess(account);
        if (state.recordStore.getTrialStatus().isExpired) {
            throw new ApiError(
                403,
                'The trial is read-only. Enter a license key to configure secrets.',
            );
        }
        const dataOperations = getDataOperations(state);
        const requestBody = await readBody(request);
        sendJson(response, 200, dataOperations.saveSecretsSettings(requestBody));
        return true;
    }

    return false;
};
