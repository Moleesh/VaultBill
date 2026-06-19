/** @format */

/** Fetch helper that routes browser-hosted calls to the desktop Local API when available. */

const requestedLocalApiBaseUrl = import.meta.env.VITE_LOCAL_API_URL?.trim();
const hostedDevApiPort =
    window.location.port === '5173' || window.location.port === '' ? '8000' : '';
const defaultLocalApiBaseUrl =
    hostedDevApiPort.length > 0 ? `http://127.0.0.1:${hostedDevApiPort}` : window.location.origin;
const localApiBaseUrl =
    requestedLocalApiBaseUrl === undefined || requestedLocalApiBaseUrl.length === 0
        ? defaultLocalApiBaseUrl
        : requestedLocalApiBaseUrl;
const csrfStorageKey = 'vaultbill.hosted.csrf';

export const setHostedCsrfToken = (token: string | undefined) => {
    if (token) window.sessionStorage.setItem(csrfStorageKey, token);
    else window.sessionStorage.removeItem(csrfStorageKey);
};

export const requestHostedApi = async <T>(
    path: string,
    method: 'GET' | 'POST' = 'GET',
    body?: unknown,
): Promise<T> => {
    const csrfToken = window.sessionStorage.getItem(csrfStorageKey);
    const response = await fetch(`${localApiBaseUrl}${path}`, {
        method,
        credentials: 'include',
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            ...(method === 'POST' && csrfToken ? { 'x-vaultbill-csrf': csrfToken } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const responseBody = await response.text();
    const payload = responseBody.length > 0 ? (JSON.parse(responseBody) as unknown) : undefined;

    if (!response.ok) {
        throw new Error(
            typeof payload === 'object' &&
                payload !== null &&
                'error' in payload &&
                typeof payload.error === 'string'
                ? payload.error
                : `Hosted API request failed with status ${String(response.status)}.`,
        );
    }

    return payload as T;
};

export const createHostedBackup = async (
    encrypted: boolean,
    currentPassword: string,
): Promise<{
    readonly blob: Blob;
    readonly fileName: string;
    readonly recoveryKey?: string;
}> => {
    const response = await fetch(`${localApiBaseUrl}/backup/create`, {
        method: 'POST',
        credentials: 'include',
        headers: hostedMutationHeaders({ 'content-type': 'application/json' }),
        body: JSON.stringify({ encrypted, currentPassword }),
    });
    if (!response.ok) throw new Error(await hostedErrorMessage(response));
    const disposition = response.headers.get('content-disposition') ?? '';
    const fileName = /filename="([^"]+)"/u.exec(disposition)?.[1] ?? 'vaultbill-backup.zip';
    const recoveryKey = response.headers.get('x-vaultbill-recovery-key') ?? undefined;
    return {
        blob: await response.blob(),
        fileName,
        ...(recoveryKey ? { recoveryKey } : {}),
    };
};

export const restoreHostedBackup = async (
    file: File,
    secrets: {
        readonly sysAdminPassword: string;
        readonly backupPassword?: string;
        readonly recoveryKey?: string;
    },
): Promise<void> => {
    const response = await fetch(`${localApiBaseUrl}/backup/restore`, {
        method: 'POST',
        credentials: 'include',
        headers: hostedMutationHeaders({
            'content-type': 'application/zip',
            'x-vaultbill-sysadmin-password': encodeHeaderSecret(secrets.sysAdminPassword),
            ...(secrets.backupPassword
                ? { 'x-vaultbill-backup-password': encodeHeaderSecret(secrets.backupPassword) }
                : {}),
            ...(secrets.recoveryKey
                ? { 'x-vaultbill-recovery-key': encodeHeaderSecret(secrets.recoveryKey) }
                : {}),
        }),
        body: file,
    });
    if (!response.ok) throw new Error(await hostedErrorMessage(response));
};

const hostedMutationHeaders = (
    headers: Readonly<Record<string, string>>,
): Readonly<Record<string, string>> => {
    const csrfToken = window.sessionStorage.getItem(csrfStorageKey);
    return {
        accept: 'application/json',
        ...(csrfToken ? { 'x-vaultbill-csrf': csrfToken } : {}),
        ...headers,
    };
};

const hostedErrorMessage = async (response: Response): Promise<string> => {
    const text = await response.text();
    if (text) {
        try {
            const payload = JSON.parse(text) as { error?: unknown };
            if (typeof payload.error === 'string') return payload.error;
        } catch {
            // Keep the status fallback for non-JSON host errors.
        }
    }
    return `Hosted API request failed with status ${String(response.status)}.`;
};

const encodeHeaderSecret = (value: string): string => {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return window.btoa(binary);
};
