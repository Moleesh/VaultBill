/** @format */

import { describe, expect, it } from 'vitest';

import { canUseSmsProvider, createSmsFailure, maskSmsSecrets } from './SmsProvider';

const enabledSettings = {
    Enabled: true,
    ProviderId: 'textbee',
    EndpointUrl: 'https://sms.example/send',
    SenderId: 'VAULT',
    UseServerSideProxy: false,
    Secrets: {
        ApiKey: 'apikey-123456',
        ApiSecret: 'secret-7890',
    },
};

describe('SmsProvider', () => {
    it('masks secrets before settings are displayed', () => {
        expect(maskSmsSecrets(enabledSettings)).toMatchObject({
            Secrets: { ApiKey: '****3456', ApiSecret: '****7890' },
        });
    });

    it('blocks direct secrets in production web mode', () => {
        expect(canUseSmsProvider(enabledSettings, 'ProductionWeb')).toMatchObject({
            ok: false,
            userMessage:
                'Production web SMS must use a server-side provider flow. Direct secrets are not allowed.',
        });
        expect(
            canUseSmsProvider({ ...enabledSettings, UseServerSideProxy: true }, 'ProductionWeb'),
        ).toMatchObject({ ok: true });
    });

    it('returns clear provider failure messages', () => {
        expect(createSmsFailure('Gateway timeout')).toEqual({
            ok: false,
            userMessage: 'Gateway timeout',
        });
    });
});
