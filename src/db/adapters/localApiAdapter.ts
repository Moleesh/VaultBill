/** @format */

import type { DocumentRecord } from '../../features/records/DocumentRecordSchema';
import type {
    CancelRecordInput,
    DraftRecordInput,
    FinalizeRecordInput,
} from '../../features/records/RecordTypes';
import type { OperatorContext } from '../../features/auth/AccountTypes';
import type { ReportConfig } from '../../engines/reportEngine/ReportTypes';
import type { StoredDocumentFormat } from '../../engines/schemaEngine/DocumentFormatTypes';
import type { AdapterStatus } from '../index';

export const localApiAdapterStatus: AdapterStatus = {
    mode: 'LanLocalApi',
    isAvailable: true,
    message: 'LAN Local API adapter is available for browser clients.',
};

export type LocalApiClientOptions = {
    readonly baseUrl: string;
    readonly fetcher: LocalApiFetch;
};

export type LocalApiFetch = (
    url: string,
    init: {
        readonly method: 'GET' | 'POST';
        readonly headers: Readonly<Record<string, string>>;
        readonly body?: string;
    },
) => Promise<LocalApiFetchResponse>;

export type LocalApiFetchResponse = {
    readonly ok: boolean;
    readonly status: number;
    readonly json: () => Promise<unknown>;
};

export type LocalApiHealth = {
    readonly appName: string;
    readonly status: 'Ready';
    readonly passwordRequired: boolean;
};

export type BackupCapability = {
    readonly isAvailable: boolean;
    readonly reason?: string;
};

export const createLocalApiClient = (options: LocalApiClientOptions) => ({
    getHealth: () => request<LocalApiHealth>(options, 'GET', '/health'),
    listDocumentFormats: () =>
        request<readonly StoredDocumentFormat[]>(options, 'GET', '/document-formats'),
    saveDraft: (input: DraftRecordInput) =>
        request<DocumentRecord>(options, 'POST', '/records/draft', input),
    finalizeDraft: (input: FinalizeRecordInput) =>
        request<DocumentRecord>(options, 'POST', '/records/finalize', input),
    cancelFinalized: (input: CancelRecordInput) =>
        request<DocumentRecord>(options, 'POST', '/records/cancel', input),
    getRecordForReprint: (recordId: string, operatorContext: OperatorContext) =>
        request<DocumentRecord>(options, 'POST', '/records/reprint', {
            recordId,
            operatorContext,
        }),
    preparePrintPreview: (input: unknown) =>
        request<unknown>(options, 'POST', '/print/preview', input),
    listReports: () => request<readonly ReportConfig[]>(options, 'GET', '/reports'),
    previewBulkImport: (input: unknown) =>
        request<unknown>(options, 'POST', '/bulk-import/preview', input),
    getBackupCapability: () => request<BackupCapability>(options, 'GET', '/backup/capability'),
});

const request = async <T>(
    options: LocalApiClientOptions,
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
): Promise<T> => {
    const response = await options.fetcher(`${options.baseUrl}${path}`, {
        method,
        headers: {
            'content-type': 'application/json',
            accept: 'application/json',
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    let payload: unknown;
    if (response.status !== 204) {
        try {
            payload = await response.json();
        } catch (reason) {
            if (!response.ok) throw reason;
        }
    }

    if (!response.ok) {
        throw new Error(getErrorMessage(payload, response.status));
    }

    return payload as T;
};

const getErrorMessage = (payload: unknown, status: number): string => {
    if (
        typeof payload === 'object' &&
        payload !== null &&
        'error' in payload &&
        typeof payload.error === 'string'
    ) {
        return payload.error;
    }

    return `Local API request failed with status ${status.toString()}.`;
};
