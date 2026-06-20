/** @format */

import type { CapabilityRegistry } from './Capability.types';

const detectRuntimeMode = (): 'demo' | 'desktop' | 'web' => {
    if (import.meta.env.VITE_DEMO_MODE === 'true') return 'demo';
    if (window.vaultBillRuntime === 'desktop' || window.vaultBillDesktop) {
        return 'desktop';
    }
    return 'web';
};

export const buildCapabilities = (): CapabilityRegistry => {
    const runtimeMode = detectRuntimeMode();
    const isDesktop = runtimeMode === 'desktop';
    const isDemoMode = runtimeMode === 'demo';
    const isHostedWeb = runtimeMode === 'web';

    return {
        isDesktop,
        isDemoMode,
        isHostedWeb,
        canListPrinters: isDesktop,
        canSelectExactPrinter: isDesktop,
        canBrowserPrint: true,
        canDownloadPdf: isDesktop,
        canBackup: isDesktop || isHostedWeb,
        canRestore: isDesktop || isHostedWeb,
        canUsbSignaturePad: isDesktop,
        canLanServer: isDesktop,
        canSmsIntegration: !isDemoMode,
        canGspIntegration: !isDemoMode,
        hasLocalDb: isDesktop,
    };
};
