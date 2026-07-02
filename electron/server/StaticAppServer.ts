/** @format */

import { readFile, stat } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';

const contentTypes: Readonly<Record<string, string>> = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
};
const staticBasePath = '/VaultBill/';

export const tryServeStaticApp = async (
    request: IncomingMessage,
    response: ServerResponse,
    staticDirectory: string,
): Promise<boolean> => {
    if (request.method !== 'GET' || isApiPath(request.url)) return false;
    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://local').pathname);
    if (pathname === '/') {
        response.writeHead(302, {
            location: staticBasePath,
            'x-content-type-options': 'nosniff',
        });
        response.end();
        return true;
    }
    if (pathname === staticBasePath.slice(0, -1)) {
        const query = request.url?.includes('?') ? request.url.slice(request.url.indexOf('?')) : '';
        response.writeHead(302, {
            location: `${staticBasePath}${query}`,
            'x-content-type-options': 'nosniff',
        });
        response.end();
        return true;
    }
    const requestPath = normalizeStaticRequestPath(pathname);
    const relativePath = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/u, '');
    const requestedFile = path.resolve(staticDirectory, relativePath);
    const root = path.resolve(staticDirectory);
    const safeFile = requestedFile.startsWith(root) ? requestedFile : path.join(root, 'index.html');
    const filePath = (await isFile(safeFile)) ? safeFile : path.join(root, 'index.html');

    try {
        const body = await readFile(filePath);
        response.writeHead(200, {
            'content-type': contentTypes[path.extname(filePath)] ?? 'application/octet-stream',
            'x-content-type-options': 'nosniff',
        });
        response.end(body);
        return true;
    } catch {
        return false;
    }
};

const normalizeStaticRequestPath = (requestPath: string): string =>
    requestPath === staticBasePath.slice(0, -1)
        ? '/'
        : requestPath.startsWith(staticBasePath)
          ? requestPath.slice(staticBasePath.length - 1)
          : requestPath;

const isApiPath = (url: string | undefined): boolean =>
    url === '/health' ||
    [
        '/auth',
        '/setup',
        '/accounts',
        '/records',
        '/builder',
        '/document-formats',
        '/reports',
        '/window',
        '/workspace',
        '/print',
        '/backup',
        '/credentials',
        '/application',
        '/settings',
        '/trial',
    ].some((prefix) => url?.startsWith(prefix) === true);

const isFile = async (filePath: string): Promise<boolean> => {
    try {
        return (await stat(filePath)).isFile();
    } catch {
        return false;
    }
};
