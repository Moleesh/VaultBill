/** @format */

import type { CapabilityRegistry } from './Capability.types';

const desktopRuntimeMarker = 'desktop';
const runtimeStorageKey = 'vaultbill.runtime-mode';

const hasDesktopRuntimeMarker = (): boolean =>
    new URLSearchParams(window.location.search).get('runtime') === desktopRuntimeMarker;

const hasElectronUserAgent = (): boolean => navigator.userAgent.includes('Electron');

const readRememberedRuntimeMode = (): 'desktop' | 'web' | null => {
    try {
        const rememberedRuntimeMode = window.sessionStorage.getItem(runtimeStorageKey);
        return rememberedRuntimeMode === 'desktop' || rememberedRuntimeMode === 'web'
            ? rememberedRuntimeMode
            : null;
    } catch {
        return null;
    }
};

const rememberRuntimeMode = (runtimeMode: 'desktop' | 'web'): void => {
    try {
        window.sessionStorage.setItem(runtimeStorageKey, runtimeMode);
    } catch {
        // Ignore storage restrictions and continue with live runtime detection only.
    }
};

export const isDesktopRuntime = (): boolean =>
    (() => {
        const detectedDesktopRuntime =
            hasDesktopRuntimeMarker() ||
            hasElectronUserAgent() ||
            window.vaultBillRuntime === 'desktop' ||
            window.vaultBillDesktop !== undefined;

        if (detectedDesktopRuntime) {
            rememberRuntimeMode('desktop');
            return true;
        }

        return readRememberedRuntimeMode() === 'desktop';
    })();

export const shouldRenderDesktopChrome = (capabilities: CapabilityRegistry): boolean =>
    capabilities.isDesktop || isDesktopRuntime();

const detectRuntimeMode = (): 'demo' | 'desktop' | 'web' => {
    if (import.meta.env.VITE_DEMO_MODE === 'true') return 'demo';
    if (isDesktopRuntime()) return 'desktop';
    if (readRememberedRuntimeMode() === 'desktop') return 'desktop';
    rememberRuntimeMode('web');
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
