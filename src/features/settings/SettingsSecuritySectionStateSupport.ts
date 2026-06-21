/** @format */

import { useForm } from '@tanstack/react-form';

import { requestHostedApi } from '../../runtime/HostedApi';

/** Default hosted-web port used when desktop LAN access is enabled. */
export const defaultHostedWebPort = 80;

/** Runtime trial status shown by the settings security section. */
export type TrialStatus = {
    readonly isFullVersion: boolean;
    readonly isExpired: boolean;
    readonly remainingSeconds: number;
};

/** Default-credential status surfaced to the settings security section. */
export type CredentialStatus = {
    readonly sysAdminUsesDefaultPassword: boolean;
    readonly backupUsesDefaultPassword: boolean;
};

type SettingsActivationFormValues = {
    readonly licenseKey: string;
};

const useSettingsActivationForm = () =>
    useForm({
        defaultValues: {
            licenseKey: '',
        } satisfies SettingsActivationFormValues,
    });

/** Form API used by the settings license activation input. */
export type SettingsActivationFormApi = ReturnType<typeof useSettingsActivationForm>;

/** Creates the activation form used by the settings security section. */
export const useCreateSettingsActivationForm = useSettingsActivationForm;

/** Loads trial, credential, and hosted-web availability state from the active runtime. */
export const loadSettingsSecurityRuntimeState = async (isHostedWeb: boolean) => {
    if (window.vaultBillDesktop) {
        const [credentialStatus, trialStatus, hostedWebSettings] = await Promise.all([
            window.vaultBillDesktop.getCredentialStatus(),
            window.vaultBillDesktop.getTrialStatus(),
            window.vaultBillDesktop.getHostedWebSettings(),
        ]);
        return {
            credentialStatus,
            lanEnabled: hostedWebSettings.lanEnabled,
            trialStatus,
        };
    }
    if (isHostedWeb) {
        const [credentialStatus, trialStatus] = await Promise.all([
            requestHostedApi<CredentialStatus>('/credentials/status'),
            requestHostedApi<TrialStatus>('/trial/status'),
        ]);
        return {
            credentialStatus,
            lanEnabled: false,
            trialStatus,
        };
    }
    return {
        credentialStatus: undefined,
        lanEnabled: false,
        trialStatus: undefined,
    };
};
