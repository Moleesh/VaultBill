/** @format */

import { describe, expect, it } from 'vitest';

import { buildGspHookPlan, maskGspSettings } from './GspHooks';

const settings = {
    Enabled: true,
    ProviderId: 'generic-gsp',
    BaseUrl: 'https://gsp.example/api/',
    Sandbox: true,
    ClientId: 'client-1',
    ClientSecret: 'super-secret-4567',
    Endpoints: {
        EInvoice: '/einvoice',
        Gstr: '/gstr',
    },
};

describe('GspHooks', () => {
    it('builds generic endpoint requests without compliance guarantees', () => {
        expect(buildGspHookPlan(settings, 'EInvoice', { invoice: 'INV-1' })).toMatchObject({
            ok: true,
            method: 'POST',
            url: 'https://gsp.example/api/einvoice',
            body: { invoice: 'INV-1' },
            userMessage:
                'GSP hook request is prepared. VaultBill does not guarantee tax compliance.',
        });
    });

    it('returns clear messages when endpoints are incomplete', () => {
        expect(buildGspHookPlan({ ...settings, BaseUrl: '' }, 'Gstr', {})).toMatchObject({
            ok: false,
            userMessage: 'GSP endpoint configuration is incomplete.',
        });
    });

    it('masks configured client secrets', () => {
        expect(maskGspSettings(settings).ClientSecret).toBe('****4567');
    });
});
