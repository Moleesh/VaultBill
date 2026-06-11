/** @format */

import type { CapabilityRegistry } from './Capability.types';

export const buildCapabilities = (): CapabilityRegistry => {
    const isDesktop = window.vaultBillDesktop !== undefined;
    const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
    const hasHostedApi =
        window.location.port === '4317' || Boolean(import.meta.env.VITE_LOCAL_API_URL?.trim());
    const isLanBrowser = !isDesktop && !isDemoMode && hasHostedApi;

    return {
        isDesktop,
        isLanBrowser,
        isDemoMode,
        canListPrinters: isDesktop,
        canSelectExactPrinter: isDesktop,
        canBrowserPrint: true,
        canDownloadPdf: isDesktop,
        canBackup: isDesktop || isLanBrowser,
        canRestore: isDesktop || isLanBrowser,
        canUsbSignaturePad: isDesktop,
        canLanServer: isDesktop,
        canSmsIntegration: !isDemoMode,
        canGspIntegration: !isDemoMode,
        hasLocalDb: isDesktop,
    };
};
