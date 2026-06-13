/** @format */

// @vitest-environment node

import { describe, expect, it, afterEach } from 'vitest';

import { LocalApiServer } from '../../../electron/server/LocalApiServer.js';
import { createHostedSessionTestHarness } from './HostedSessionSecuritySupport.js';

const port = 43_917;
let server: LocalApiServer | undefined;
let harness = createHostedSessionTestHarness();

afterEach(async () => {
    await server?.stop();
    server = undefined;
    harness.cleanup();
    harness = createHostedSessionTestHarness();
});

describe('hosted Local API sessions', () => {
    it('requires cookie sessions and CSRF instead of trusted role headers', async () => {
        harness.credentialStore.saveAccount({
            userId: 'admin_1',
            username: 'admin',
            displayName: 'Operations Admin',
            role: 'Admin',
            isActive: true,
        });
        harness.credentialStore.resetPassword('admin_1', 'admin-password');
        server = new LocalApiServer(
            harness.recordStore,
            harness.credentialStore,
            harness.builderStore,
            harness.settingsStore,
            harness.directory,
            { port },
        );
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
});
