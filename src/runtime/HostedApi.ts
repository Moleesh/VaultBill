/** @format */

/** Fetch helper that routes browser-hosted calls to the desktop Local API when available. */

const hostedDevApiPort = import.meta.env.DEV && window.location.port === '5173' ? '8000' : '';
const defaultLocalApiBaseUrl =
    hostedDevApiPort.length > 0 ? `http://127.0.0.1:${hostedDevApiPort}` : window.location.origin;
const localApiBaseUrl = defaultLocalApiBaseUrl;
const csrfStorageKey = 'vaultbill.hosted.csrf';
const localHostedOrigins = new Set(['localhost', '127.0.0.1', '[::1]']);
export const hostedApiUnavailableEvent = 'vaultbill-hosted-api-unavailable';
export const hostedApiRecoveredEvent = 'vaultbill-hosted-api-recovered';

export const canUseLocalHostedApi = (): boolean => localHostedOrigins.has(window.location.hostname);

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
    let response: Response;
    try {
        response = await fetch(`${localApiBaseUrl}${path}`, {
            method,
            credentials: 'include',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                ...(method === 'POST' && csrfToken ? { 'x-vaultbill-csrf': csrfToken } : {}),
            },
            ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
    } catch (error) {
        window.dispatchEvent(new CustomEvent(hostedApiUnavailableEvent));
        throw error;
    }
    const responseBody = await response.text();
    const payload = responseBody.length > 0 ? (JSON.parse(responseBody) as unknown) : undefined;

    if (!response.ok) {
        if (response.status >= 500 || response.status === 404) {
            window.dispatchEvent(new CustomEvent(hostedApiUnavailableEvent));
        }
        throw new Error(
            typeof payload === 'object' &&
                payload !== null &&
                'error' in payload &&
                typeof payload.error === 'string'
                ? payload.error
                : `Hosted API request failed with status ${String(response.status)}.`,
        );
    }

    window.dispatchEvent(new CustomEvent(hostedApiRecoveredEvent));
    return payload as T;
};

export const requestHostedWindowAction = async (action: 'close' | 'minimize'): Promise<void> => {
    await requestHostedApi(`/window/${action}`, 'POST');
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
