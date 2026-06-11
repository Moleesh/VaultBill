/** @format */

import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

const contentTypes: Readonly<Record<string, string>> = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
};

export const tryServeStaticApp = async (
    request: IncomingMessage,
    response: ServerResponse,
    staticDirectory: string,
): Promise<boolean> => {
    if (request.method !== 'GET' || isApiPath(request.url)) return false;
    const requestPath = decodeURIComponent(new URL(request.url ?? '/', 'http://local').pathname);
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

const isApiPath = (url: string | undefined): boolean =>
    url === '/health' ||
    [
        '/auth',
        '/accounts',
        '/records',
        '/builder',
        '/document-formats',
        '/reports',
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
