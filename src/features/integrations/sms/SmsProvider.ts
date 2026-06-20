/** @format */

import type { SmsProviderSettings } from '../../../db/startup/ConfigSchemas';
import { maskSecret } from '../MaskSecret';

export type SmsDeploymentMode = 'Desktop' | 'HostedWeb' | 'WebDemo' | 'ProductionWeb';

export type SmsSendRequest = {
    readonly to: string;
    readonly message: string;
    readonly recordId?: string;
};

export type SmsProviderAdapter = {
    readonly providerId: string;
    sendSms(request: SmsSendRequest): Promise<SmsSendResult>;
};

export type SmsSendResult = {
    readonly ok: boolean;
    readonly providerReference?: string;
    readonly userMessage: string;
};

export const maskSmsSecrets = (settings: SmsProviderSettings): SmsProviderSettings => ({
    ...settings,
    Secrets: {
        ApiKey: maskSecret(settings.Secrets.ApiKey),
        ApiSecret: maskSecret(settings.Secrets.ApiSecret),
    },
});

export const canUseSmsProvider = (
    settings: SmsProviderSettings,
    deploymentMode: SmsDeploymentMode,
): SmsSendResult => {
    if (!settings.Enabled) {
        return { ok: false, userMessage: 'SMS integration is disabled in settings.' };
    }

    if (!settings.ProviderId.trim() || !settings.EndpointUrl.trim()) {
        return {
            ok: false,
            userMessage: 'SMS integration configuration is incomplete.',
        };
    }

    if (deploymentMode === 'ProductionWeb' && !settings.UseServerSideProxy) {
        return {
            ok: false,
            userMessage:
                'Production web SMS must use a server-side integration flow. Direct secrets are not allowed.',
        };
    }

    return { ok: true, userMessage: 'SMS integration is ready.' };
};

export const createSmsFailure = (message: string): SmsSendResult => ({
    ok: false,
    userMessage: message.trim() || 'SMS integration failed. Please check settings.',
});
