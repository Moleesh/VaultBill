/** @format */

// @vitest-environment node
/* eslint-disable max-lines */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CredentialStore } from '../../../electron/CredentialStore.js';
import { BuilderStore } from '../../../electron/BuilderStore.js';
import { DesktopRecordStore } from '../../../electron/RecordStore.js';
import { LocalApiServer } from '../../../electron/server/LocalApiServer.js';

const port = 43_917;
let directory: string | undefined;
let server: LocalApiServer | undefined;
let credentialStore: CredentialStore | undefined;
let recordStore: DesktopRecordStore | undefined;
let builderStore: BuilderStore | undefined;

afterEach(async () => {
    await server?.stop();
    recordStore?.close();
    credentialStore?.close();
    builderStore?.close();
    server = undefined;
    recordStore = undefined;
    credentialStore = undefined;
    builderStore = undefined;
    if (directory) rmSync(directory, { recursive: true, force: true });
    directory = undefined;
});

describe('hosted Local API sessions', () => {
    it('requires cookie sessions and CSRF instead of trusted role headers', async () => {
        directory = mkdtempSync(path.join(tmpdir(), 'vaultbill-hosted-session-'));
        const databasePath = path.join(directory, 'vaultbill.sqlite');
        credentialStore = new CredentialStore(databasePath, {
            encryptString: (value) => Buffer.from(value),
            decryptString: (value) => value.toString('utf8'),
        });
        credentialStore.saveAccount({
            userId: 'admin_1',
            username: 'admin',
            displayName: 'Operations Admin',
            role: 'Admin',
            isActive: true,
        });
        credentialStore.resetPassword('admin_1', 'admin-password');
        recordStore = new DesktopRecordStore(databasePath);
        builderStore = new BuilderStore(databasePath);
        server = new LocalApiServer(recordStore, credentialStore, builderStore, directory, {
            port,
        });
        await server.start();
        const baseUrl = `http://127.0.0.1:${String(port)}`;

        const spoofed = await fetch(`${baseUrl}/records`, {
            headers: { 'x-vaultbill-role': 'Admin' },
        });
        expect(spoofed.status).toBe(401);

        const login = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ userId: 'admin_1', password: 'admin-password' }),
        });
        expect(login.status).toBe(200);
        const cookie = login.headers.get('set-cookie')?.split(';')[0];
        const session = (await login.json()) as { csrfToken: string };
        expect(cookie).toContain('vaultbill_session=');

        const list = await fetch(`${baseUrl}/records`, { headers: { cookie: cookie ?? '' } });
        expect(list.status).toBe(200);
        const builder = await fetch(`${baseUrl}/builder/package`, {
            headers: { cookie: cookie ?? '' },
        });
        expect(builder.status).toBe(403);
        const printTemplate = await fetch(`${baseUrl}/print/template?formatId=TaxInvoice`, {
            headers: { cookie: cookie ?? '' },
        });
        expect(printTemplate.status).toBe(204);

        const record = {
            recordId: 'record-1',
            formatId: 'TaxInvoice',
            formatName: 'GST Invoice',
            invoiceDate: '2026-06-07',
            customerName: 'Hosted Customer',
            gstin: '',
            state: '',
            billingAddress: '',
            lineItems: [],
            grandTotal: '0.00',
        };
        const rejected = await fetch(`${baseUrl}/records/draft`, {
            method: 'POST',
            headers: { cookie: cookie ?? '', 'content-type': 'application/json' },
            body: JSON.stringify({ record }),
        });
        expect(rejected.status).toBe(403);

        const accepted = await fetch(`${baseUrl}/records/draft`, {
            method: 'POST',
            headers: {
                cookie: cookie ?? '',
                'content-type': 'application/json',
                'x-vaultbill-csrf': session.csrfToken,
            },
            body: JSON.stringify({ record }),
        });
        expect(accepted.status).toBe(200);
        await expect(accepted.json()).resolves.toMatchObject({
            recordId: 'record-1',
            createdBy: 'admin_1',
            createdByName: 'Operations Admin',
        });
    });

    it('protects hosted backup, restore, credential, and reset operations', async () => {
        directory = mkdtempSync(path.join(tmpdir(), 'vaultbill-hosted-data-'));
        const databasePath = path.join(directory, 'vaultbill.sqlite');
        credentialStore = new CredentialStore(databasePath, {
            encryptString: (value) => Buffer.from(value),
            decryptString: (value) => value.toString('utf8'),
        });
        recordStore = new DesktopRecordStore(databasePath);
        builderStore = new BuilderStore(databasePath);
        const restoreBackup = vi.fn();
        const resetApplicationData = vi.fn();
        const setBackupPassword = vi.fn(() => ({
            sysAdminUsesDefaultPassword: true,
            backupUsesDefaultPassword: false,
        }));
        server = new LocalApiServer(
            recordStore,
            credentialStore,
            builderStore,
            directory,
            { port: port + 1 },
            {
                createBackup: (_encrypted, password) => {
                    if (password !== '147085aA') throw new Error('The password is incorrect.');
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
                saveBusinessSettings: (input) => input,
                getIntegrationSettings: () => ({}),
                saveIntegrationSettings: (input) => input,
            },
        );
        await server.start();
        const baseUrl = `http://127.0.0.1:${String(port + 1)}`;
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
            body: JSON.stringify({ encrypted: true, currentPassword: '147085aA' }),
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
                'x-vaultbill-sysadmin-password': encodeSecret('147085aA'),
                'x-vaultbill-backup-password': encodeSecret('backup-secret'),
            },
            body: new Uint8Array([4, 5, 6]),
        });
        expect(restore.status).toBe(202);
        expect(restoreBackup).toHaveBeenCalledWith(
            new Uint8Array([4, 5, 6]),
            '147085aA',
            'backup-secret',
            '',
        );

        const credentials = await fetch(`${baseUrl}/credentials/backup-password`, {
            method: 'POST',
            headers: { ...mutationHeaders, 'content-type': 'application/json' },
            body: JSON.stringify({
                currentPassword: '147085aA',
                backupPassword: 'changed-backup-password',
            }),
        });
        expect(credentials.status).toBe(200);
        expect(setBackupPassword).toHaveBeenCalledWith('147085aA', 'changed-backup-password');

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

const encodeSecret = (value: string): string => Buffer.from(value, 'utf8').toString('base64');
