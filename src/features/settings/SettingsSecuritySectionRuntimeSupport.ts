/** @format */

import { loadWorkspaceSettings } from '../../runtime/WorkspaceSettings';

type HostedDesktopBridge = {
    readonly configureLocalApi: (request: {
        readonly autoStart: boolean;
        readonly lanEnabled: boolean;
        readonly passwordRequired: boolean;
        readonly port: number;
    }) => Promise<unknown>;
    readonly restartHostedWebServer: () => Promise<{ readonly isRunning: boolean }>;
    readonly startHostedWebServer: () => Promise<{ readonly isRunning: boolean }>;
    readonly stopHostedWebServer: () => Promise<{ readonly isRunning: boolean }>;
};

const fallbackHostedWebError = (message: string): never => {
    throw new Error(message);
};

/** Persists the local hosted-web startup configuration. */
export const saveHostedWebConfiguration = async (input: {
    readonly autoStart: boolean;
    readonly desktopBridge: HostedDesktopBridge | undefined;
    readonly lanEnabled: boolean;
    readonly port: number;
}): Promise<void> => {
    await input.desktopBridge?.configureLocalApi({
        autoStart: input.autoStart,
        lanEnabled: input.lanEnabled,
        passwordRequired: true,
        port: input.port,
    });
};

/** Runs one hosted web server action and returns its latest running status. */
export const runHostedWebServerAction = async (
    action: 'startHostedWebServer' | 'stopHostedWebServer' | 'restartHostedWebServer',
    desktopBridge: HostedDesktopBridge | undefined,
): Promise<boolean> => {
    const bridge = desktopBridge ?? fallbackHostedWebError('Desktop runtime is unavailable.');
    const status = await bridge[action]();
    return status.isRunning;
};

/** Saves the include-drafts setting through the active runtime. */
export const saveIncludeDraftsInReportsSetting = async (input: {
    readonly isHostedWeb: boolean;
    readonly value: boolean;
}): Promise<void> => {
    const current = await loadWorkspaceSettings(input.isHostedWeb);
    const nextSettings = { ...current, includeDraftsInReports: input.value };
    if (window.vaultBillDesktop) {
        await window.vaultBillDesktop.saveBusinessSettings(nextSettings);
        return;
    }
    if (input.isHostedWeb) {
        const { requestHostedApi } = await import('../../runtime/HostedApi');
        await requestHostedApi('/settings/business', 'POST', nextSettings);
    }
};
