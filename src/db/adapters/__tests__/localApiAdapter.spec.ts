/** @format */

import { describe, expect, it } from 'vitest';

import { createLocalApiClient, localApiAdapterStatus } from '../localApiAdapter';
import type { LocalApiFetch } from '../localApiAdapter';

describe('localApiAdapter', () => {
    it('calls typed hosted web endpoints with JSON headers and base URL', async () => {
        const calls: string[] = [];
        const fetcher: LocalApiFetch = (url, init) => {
            calls.push(`${init.method} ${url} ${init.body ?? ''}`);
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () =>
                    Promise.resolve(
                        url.endsWith('/health')
                            ? {
                                  appName: 'VaultBill',
                                  status: 'Ready',
                                  passwordRequired: false,
                              }
                            : [],
                    ),
            });
        };
        const client = createLocalApiClient({
            baseUrl: 'http://127.0.0.1:48110',
            fetcher,
        });

        await expect(client.getHealth()).resolves.toMatchObject({
            appName: 'VaultBill',
            status: 'Ready',
        });
        await expect(client.listDocumentFormats()).resolves.toEqual([]);
        expect(calls).toEqual([
            'GET http://127.0.0.1:48110/health ',
            'GET http://127.0.0.1:48110/document-formats ',
        ]);
        expect(localApiAdapterStatus.isAvailable).toBe(true);
    });

    it('preserves operator context in record action request bodies', async () => {
        let requestBody = '';
        const fetcher: LocalApiFetch = (_url, init) => {
            requestBody = init.body ?? '';
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ RecordId: 'Record_01' }),
            });
        };
        const client = createLocalApiClient({ baseUrl: 'http://lan', fetcher });

        await client.getRecordForReprint('Record_01', {
            account: {
                userId: 'user_1',
                username: 'operator',
                displayName: 'Counter Operator',
                role: 'User',
                isActive: true,
            },
            role: 'User',
            CreatedBy: 'user_1',
            CreatedByName: 'Counter Operator',
            LastActionBy: 'user_1',
            LastActionByName: 'Counter Operator',
        });

        expect(JSON.parse(requestBody)).toMatchObject({
            recordId: 'Record_01',
            operatorContext: { role: 'User', LastActionBy: 'user_1' },
        });
    });

    it('surfaces Local API error payloads', async () => {
        const client = createLocalApiClient({
            baseUrl: 'http://lan',
            fetcher: () =>
                Promise.resolve({
                    ok: false,
                    status: 403,
                    json: () => Promise.resolve({ error: 'Access denied.' }),
                }),
        });

        await expect(client.getBackupCapability()).rejects.toThrow('Access denied.');
    });
});
