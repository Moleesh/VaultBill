/** @format */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { z } from 'zod';

import type { DesktopOperatorAccount } from '../CredentialStore.js';
import {
    ApiError,
    assertWritableTrial,
    requireDataOperations,
    type LocalApiState,
} from './LocalApiContext.js';
import { readBody, sendJson } from './LocalApiHttp.js';
import { canUseLocalApiAction } from './LocalApiSecurity.js';

type RecordRouteAction = 'saveDraft' | 'finalize' | 'cancel';

/** Restricts Builder routes to the protected System Administrator account. */
const requireBuilderAccess = (account: DesktopOperatorAccount, message: string) => {
    if (account.role !== 'SysAdmin') {
        throw new ApiError(403, message);
    }
};

/** Resolves the format identifier from a local route query string. */
const readFormatId = (requestUrl: string): string | undefined =>
    new URL(requestUrl, 'http://local').searchParams.get('formatId') ?? undefined;

/** Sends one Builder package response or an empty success when nothing was found. */
const sendBuilderPackage = (
    state: LocalApiState,
    response: ServerResponse,
    formatId?: string,
): boolean => {
    const builderPackage = state.builderStore.load(formatId);
    if (!builderPackage) {
        response.writeHead(204);
        response.end();
        return true;
    }
    sendJson(response, 200, builderPackage);
    return true;
};

/** Resolves the record mutation represented by the current route, if any. */
const getRecordRouteAction = (requestUrl?: string): RecordRouteAction | undefined => {
    if (requestUrl === '/records/draft') return 'saveDraft';
    if (requestUrl === '/records/finalize') return 'finalize';
    if (requestUrl === '/records/cancel') return 'cancel';
    return undefined;
};

/** Adds the authenticated operator context required by record mutations. */
const withOperatorContext = (
    account: DesktopOperatorAccount,
    requestBody: Record<string, unknown>,
) => ({
    ...requestBody,
    operatorContext: {
        account,
        role: account.role,
        CreatedBy: account.userId,
        CreatedByName: account.displayName,
        LastActionBy: account.userId,
        LastActionByName: account.displayName,
    },
});

/** Handles builder, print, report, and record routes. */
export const handleLocalApiContentRoutes = async (
    state: LocalApiState,
    account: DesktopOperatorAccount,
    request: IncomingMessage,
    response: ServerResponse,
): Promise<boolean> => {
    if (request.method === 'GET' && request.url?.startsWith('/builder/package')) {
        requireBuilderAccess(account, 'Only the System Administrator can use Builder.');
        return sendBuilderPackage(state, response, readFormatId(request.url));
    }
    if (request.method === 'GET' && request.url === '/builder/inventory') {
        requireBuilderAccess(account, 'Only the System Administrator can view Builder inventory.');
        sendJson(response, 200, state.builderStore.listInventory());
        return true;
    }
    if (request.method === 'POST' && request.url === '/builder/package') {
        requireBuilderAccess(account, 'Only the System Administrator can publish Builder formats.');
        assertWritableTrial(state, 'use Builder');
        sendJson(response, 200, state.builderStore.save(await readBody(request)));
        return true;
    }
    if (request.method === 'DELETE' && request.url?.startsWith('/builder/package')) {
        requireBuilderAccess(account, 'Only the System Administrator can delete Builder formats.');
        assertWritableTrial(state, 'use Builder');
        const formatId = readFormatId(request.url);
        if (!formatId) throw new ApiError(400, 'A document format is required.');
        state.builderStore.delete(formatId);
        sendJson(response, 200, { deleted: true });
        return true;
    }
    if (request.method === 'GET' && request.url?.startsWith('/print/template')) {
        return sendBuilderPackage(state, response, readFormatId(request.url));
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

    const action = getRecordRouteAction(request.url);
    if (!action) return false;
    if (!canUseLocalApiAction(account.role, action)) {
        throw new ApiError(403, 'Action is not allowed.');
    }
    assertWritableTrial(state, 'continue');
    const requestBody = (await readBody(request)) as Record<string, unknown>;
    const securedBody = withOperatorContext(account, requestBody);
    const result =
        action === 'saveDraft'
            ? state.recordStore.saveDraft(securedBody)
            : action === 'finalize'
              ? state.recordStore.finalize(securedBody)
              : state.recordStore.cancel(securedBody);
    sendJson(response, 200, result);
    return true;
};
