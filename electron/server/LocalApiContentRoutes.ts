/** @format */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { z } from 'zod';

import type { DesktopOperatorAccount } from '../CredentialStore.js';
import { canUseLocalApiAction } from './LocalApiSecurity.js';
import {
    ApiError,
    assertWritableTrial,
    readBody,
    requireDataOperations,
    sendJson,
    type LocalApiState,
} from './LocalApiContext.js';

/** Handles builder, print, report, and record routes. */
export const handleLocalApiContentRoutes = async (
    state: LocalApiState,
    account: DesktopOperatorAccount,
    request: IncomingMessage,
    response: ServerResponse,
): Promise<boolean> => {
    if (request.method === 'GET' && request.url?.startsWith('/builder/package')) {
        if (account.role !== 'SysAdmin')
            throw new ApiError(403, 'Only the System Administrator can use Builder.');
        const formatId = new URL(request.url, 'http://local').searchParams.get('formatId');
        const builderPackage = state.builderStore.load(formatId ?? undefined);
        if (!builderPackage) {
            response.writeHead(204);
            response.end();
            return true;
        }
        sendJson(response, 200, builderPackage);
        return true;
    }
    if (request.method === 'GET' && request.url === '/builder/inventory') {
        if (account.role !== 'SysAdmin') {
            throw new ApiError(403, 'Only the System Administrator can view Builder inventory.');
        }
        sendJson(response, 200, state.builderStore.listInventory());
        return true;
    }
    if (request.method === 'POST' && request.url === '/builder/package') {
        if (account.role !== 'SysAdmin') {
            throw new ApiError(403, 'Only the System Administrator can publish Builder formats.');
        }
        assertWritableTrial(state, 'use Builder');
        sendJson(response, 200, state.builderStore.save(await readBody(request)));
        return true;
    }
    if (request.method === 'GET' && request.url?.startsWith('/print/template')) {
        const formatId = new URL(request.url, 'http://local').searchParams.get('formatId');
        const builderPackage = state.builderStore.load(formatId ?? undefined);
        if (!builderPackage) {
            response.writeHead(204);
            response.end();
            return true;
        }
        sendJson(response, 200, builderPackage);
        return true;
    }
    if (request.method === 'GET' && request.url === '/print/formats') {
        sendJson(response, 200, state.builderStore.listInventory());
        return true;
    }
    if (request.method === 'POST' && request.url === '/print/html') {
        assertWritableTrial(state, 'print');
        const { printHtml } = requireDataOperations(state);
        if (!printHtml) throw new ApiError(503, 'Host printing is unavailable.');
        sendJson(response, 200, await printHtml(await readBody(request)));
        return true;
    }
    if (request.method === 'POST' && request.url === '/print/cancel') {
        const input = z.object({ jobId: z.string().min(1) }).parse(await readBody(request));
        const { cancelPrint } = requireDataOperations(state);
        if (!cancelPrint) throw new ApiError(503, 'Host print cancellation is unavailable.');
        sendJson(response, 200, { cancelled: cancelPrint(input.jobId) });
        return true;
    }
    if (request.method === 'POST' && request.url === '/reports/query') {
        if (!canUseLocalApiAction(account.role, 'list')) {
            throw new ApiError(403, 'Reports are not available to this role.');
        }
        sendJson(response, 200, state.recordStore.queryReport(await readBody(request)));
        return true;
    }
    if (request.method === 'GET' && request.url === '/records') {
        if (!canUseLocalApiAction(account.role, 'list')) {
            throw new ApiError(403, 'Records are not available to this role.');
        }
        sendJson(response, 200, state.recordStore.list());
        return true;
    }

    const body = await readBody(request);
    const action =
        request.url === '/records/draft'
            ? 'saveDraft'
            : request.url === '/records/finalize'
              ? 'finalize'
              : request.url === '/records/cancel'
                ? 'cancel'
                : undefined;
    if (!action) return false;
    if (!canUseLocalApiAction(account.role, action)) {
        throw new ApiError(403, 'Action is not allowed.');
    }
    assertWritableTrial(state, 'continue');
    const requestBody = body as Record<string, unknown>;
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
            ? state.recordStore.saveDraft(securedBody)
            : action === 'finalize'
              ? state.recordStore.finalize(securedBody)
              : state.recordStore.cancel(securedBody);
    sendJson(response, 200, result);
    return true;
};
