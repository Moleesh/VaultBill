/** @format */

import { requestHostedApi } from './HostedApi';

export type WorkspaceSettings = {
    readonly companyName: string;
    readonly address: string;
    readonly gstin: string;
    readonly theme: string;
    readonly outputTarget: 'PreviewOnly' | 'DownloadPdf' | 'SystemPrinter';
    readonly preferredPrinterName: string;
    readonly includeDraftsInReports: boolean;
};

export const defaultWorkspaceSettings: WorkspaceSettings = {
    companyName: '',
    address: '',
    gstin: '',
    theme: 'teal-flow',
    outputTarget: 'PreviewOnly',
    preferredPrinterName: '',
    includeDraftsInReports: false,
};

export const normalizeWorkspaceSettings = (value: unknown): WorkspaceSettings => {
    if (!value || typeof value !== 'object') return defaultWorkspaceSettings;
    const settings = value as Partial<WorkspaceSettings>;

    return {
        companyName:
            typeof settings.companyName === 'string'
                ? settings.companyName
                : defaultWorkspaceSettings.companyName,
        address:
            typeof settings.address === 'string'
                ? settings.address
                : defaultWorkspaceSettings.address,
        gstin: typeof settings.gstin === 'string' ? settings.gstin : defaultWorkspaceSettings.gstin,
        theme: typeof settings.theme === 'string' ? settings.theme : defaultWorkspaceSettings.theme,
        outputTarget:
            settings.outputTarget === 'DownloadPdf' || settings.outputTarget === 'SystemPrinter'
                ? settings.outputTarget
                : defaultWorkspaceSettings.outputTarget,
        preferredPrinterName:
            typeof settings.preferredPrinterName === 'string'
                ? settings.preferredPrinterName
                : defaultWorkspaceSettings.preferredPrinterName,
        includeDraftsInReports:
            typeof settings.includeDraftsInReports === 'boolean'
                ? settings.includeDraftsInReports
                : defaultWorkspaceSettings.includeDraftsInReports,
    };
};

export const loadWorkspaceSettings = async (
    isHostedWeb: boolean,
    path = '/workspace/settings',
): Promise<WorkspaceSettings> => {
    if (window.vaultBillDesktop) {
        return normalizeWorkspaceSettings(await window.vaultBillDesktop.getBusinessSettings());
    }
    if (isHostedWeb) {
        return normalizeWorkspaceSettings(await requestHostedApi(path));
    }
    return defaultWorkspaceSettings;
};
