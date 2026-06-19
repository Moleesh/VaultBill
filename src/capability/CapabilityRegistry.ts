/** @format */

import type { CapabilityRegistry } from './Capability.types';

export const buildCapabilities = (): CapabilityRegistry => {
    const isDesktop =
        window.vaultBillRuntime === 'desktop' || /Electron/i.test(navigator.userAgent);
    const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
    const hasHostedApi =
        window.location.port === '' ||
        window.location.port === '80' ||
        window.location.port === '8000' ||
        window.location.port === '5173' ||
        Boolean(import.meta.env.VITE_LOCAL_API_URL?.trim());
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
