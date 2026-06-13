/** @format */

import { timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { MAX_LOCAL_API_BODY_BYTES } from './LocalApiSecurity.js';

export const parseCookies = (header: string | undefined): Readonly<Record<string, string>> =>
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

export const safeEqual = (left: string, right: string): boolean => {
    const leftBytes = Buffer.from(left);
    const rightBytes = Buffer.from(right);
    return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
};

export const isLoopbackAddress = (address: string): boolean =>
    address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';

export const decodeHeaderSecret = (value: string | string[] | undefined): string => {
    const current = Array.isArray(value) ? value[0] : value;
    if (!current) return '';
    return Buffer.from(current, 'base64').toString('utf8');
};

export const readRawBody = async (request: IncomingMessage): Promise<Uint8Array> => {
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

export const readBody = async (request: IncomingMessage): Promise<unknown> => {
    const body = await readRawBody(request);
    const text = Buffer.from(body).toString('utf8');
    return text.length > 0 ? (JSON.parse(text) as unknown) : {};
};

export const sendJson = (response: ServerResponse, status: number, payload: unknown) => {
    response.writeHead(status);
    response.end(JSON.stringify(payload));
};

export const sendArchive = (
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

export class ApiError extends Error {
    public constructor(
        public readonly status: number,
        message: string,
    ) {
        super(message);
    }
}
