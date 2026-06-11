/** @format */

import type { GspIntegrationSettings } from '../../../db/startup/ConfigSchemas';
import { maskSecret } from '../MaskSecret';

export type GspHookKind = 'EInvoice' | 'Gstr';

export type GspHookPlan = {
    readonly ok: boolean;
    readonly method: 'POST';
    readonly url?: string;
    readonly headers?: Readonly<Record<string, string>>;
    readonly body?: unknown;
    readonly userMessage: string;
};

export const maskGspSettings = (settings: GspIntegrationSettings): GspIntegrationSettings => ({
    ...settings,
    ClientSecret: maskSecret(settings.ClientSecret),
});

export const buildGspHookPlan = (
    settings: GspIntegrationSettings,
    hookKind: GspHookKind,
    payload: unknown,
): GspHookPlan => {
    if (!settings.Enabled) {
        return disabledPlan('GSP integration is disabled in settings.');
    }

    const endpointPath = settings.Endpoints[hookKind].trim();

    if (!settings.BaseUrl.trim() || !endpointPath) {
        return disabledPlan('GSP endpoint configuration is incomplete.');
    }

    return {
        ok: true,
        method: 'POST',
        url: combineUrl(settings.BaseUrl, endpointPath),
        headers: {
            'Content-Type': 'application/json',
            'X-VaultBill-GSP-Provider': settings.ProviderId,
            'X-VaultBill-GSP-Sandbox': settings.Sandbox ? 'true' : 'false',
        },
        body: payload,
        userMessage: 'GSP hook request is prepared. VaultBill does not guarantee tax compliance.',
    };
};

const disabledPlan = (userMessage: string): GspHookPlan => ({
    ok: false,
    method: 'POST',
    userMessage,
});

const combineUrl = (baseUrl: string, endpointPath: string): string =>
    `${baseUrl.replace(/\/+$/u, '')}/${endpointPath.replace(/^\/+/u, '')}`;
