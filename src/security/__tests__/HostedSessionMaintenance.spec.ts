/** @format */

// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';

import { LocalApiServer } from '../../../electron/server/LocalApiServer.js';
import {
    createHostedSessionTestHarness,
    encodeSecret,
    getAvailablePort,
} from './HostedSessionSecuritySupport.js';

let server: LocalApiServer | undefined;
let harness = createHostedSessionTestHarness();

afterEach(async () => {
    await server?.stop();
    server = undefined;
    harness.cleanup();
    harness = createHostedSessionTestHarness();
});

describe('hosted Local API maintenance', () => {
    it('protects hosted backup, restore, credential, and reset operations', async () => {
        const port = await getAvailablePort();
        const restoreBackup = vi.fn();
        const resetApplicationData = vi.fn();
        const setBackupPassword = vi.fn((backupPassword: string) => {
            void backupPassword;
            return {
                sysAdminUsesDefaultPassword: true,
                backupUsesDefaultPassword: false,
            };
        });
        server = new LocalApiServer(
            harness.recordStore,
            harness.credentialStore,
            harness.builderStore,
            harness.settingsStore,
            harness.directory,
            { port },
            {
                createBackup: () => {
                    return {
                        bytes: new Uint8Array([1, 2, 3]),
                        fileName: 'vaultbill-backup.zip',
                        recoveryKey: 'recovery-key',
                    };
                },
                restoreBackup,
                resetApplicationData,
                getCredentialStatus: () => ({
                    sysAdminUsesDefaultPassword: true,
                    backupUsesDefaultPassword: true,
                }),
                setBackupPassword,
                getBusinessSettings: () => ({}),
                saveBusinessSettings: (input: unknown) => input,
                getSecretsSettings: () => ({}),
                saveSecretsSettings: (input: unknown) => input,
                getIntegrationSettings: () => ({}),
                saveIntegrationSettings: (input: unknown) => input,
            },
        );
        await server.start();
        const baseUrl = `http://127.0.0.1:${String(server.getConfiguration().port)}`;
        const login = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ userId: 'sysadmin_1', password: '147085aA' }),
        });
        const cookie = login.headers.get('set-cookie')?.split(';')[0] ?? '';
        const session = (await login.json()) as { csrfToken: string };
        const mutationHeaders = {
            cookie,
            'x-vaultbill-csrf': session.csrfToken,
        };

        const backup = await fetch(`${baseUrl}/backup/create`, {
            method: 'POST',
            headers: { ...mutationHeaders, 'content-type': 'application/json' },
            body: JSON.stringify({ encrypted: true }),
        });
        expect(backup.status).toBe(200);
        expect(backup.headers.get('content-type')).toBe('application/zip');
        expect(backup.headers.get('x-vaultbill-recovery-key')).toBe('recovery-key');
        expect(Array.from(new Uint8Array(await backup.arrayBuffer()))).toEqual([1, 2, 3]);

        const restore = await fetch(`${baseUrl}/backup/restore`, {
            method: 'POST',
            headers: {
                ...mutationHeaders,
                'content-type': 'application/zip',
                'x-vaultbill-backup-password': encodeSecret('backup-secret'),
            },
            body: new Uint8Array([4, 5, 6]),
        });
        expect(restore.status).toBe(202);
        expect(restoreBackup).toHaveBeenCalledWith(new Uint8Array([4, 5, 6]), 'backup-secret', '');

        const credentials = await fetch(`${baseUrl}/credentials/backup-password`, {
            method: 'POST',
            headers: { ...mutationHeaders, 'content-type': 'application/json' },
            body: JSON.stringify({
                backupPassword: 'changed-backup-password',
            }),
        });
        expect(credentials.status).toBe(200);
        expect(setBackupPassword).toHaveBeenCalledWith('changed-backup-password');

        const reset = await fetch(`${baseUrl}/application/reset`, {
            method: 'POST',
            headers: { ...mutationHeaders, 'content-type': 'application/json' },
            body: JSON.stringify({
                currentPassword: '147085aA',
                confirmation: 'RESET VAULTBILL',
            }),
        });
        expect(reset.status).toBe(202);
        expect(resetApplicationData).toHaveBeenCalledWith('147085aA', 'RESET VAULTBILL');
    });
});
