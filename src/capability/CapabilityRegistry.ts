/** @format */

import type { CapabilityRegistry } from './Capability.types';

const desktopRuntimeMarker = 'desktop';
const runtimeStorageKey = 'vaultbill.runtime-mode';
let rememberedRuntimeModeInMemory: 'desktop' | 'web' | null = null;

const hasDesktopRuntimeMarker = (): boolean =>
    new URLSearchParams(window.location.search).get('runtime') === desktopRuntimeMarker;

const hasElectronUserAgent = (): boolean => navigator.userAgent.includes('Electron');

const hasDesktopHostEnvironment = (): boolean =>
    hasElectronUserAgent() || hasDesktopRuntimeBridge();

const readRememberedRuntimeMode = (): 'desktop' | 'web' | null => {
    try {
        const rememberedRuntimeMode = window.sessionStorage.getItem(runtimeStorageKey);
        const normalizedRuntimeMode =
            rememberedRuntimeMode === 'desktop' || rememberedRuntimeMode === 'web'
                ? rememberedRuntimeMode
                : null;
        if (normalizedRuntimeMode) rememberedRuntimeModeInMemory = normalizedRuntimeMode;
        return normalizedRuntimeMode;
    } catch {
        return rememberedRuntimeModeInMemory;
    }
};

const readStableRememberedRuntimeMode = (): 'desktop' | 'web' | null => {
    const rememberedRuntimeMode = readRememberedRuntimeMode();
    return rememberedRuntimeMode ?? rememberedRuntimeModeInMemory;
};

const rememberRuntimeMode = (runtimeMode: 'desktop' | 'web'): void => {
    rememberedRuntimeModeInMemory = runtimeMode;
    try {
        window.sessionStorage.setItem(runtimeStorageKey, runtimeMode);
    } catch {
        // Ignore storage restrictions and continue with the in-memory runtime fallback.
    }
};

const hasDesktopRuntimeBridge = (): boolean =>
    window.vaultBillRuntime === 'desktop' || window.vaultBillDesktop !== undefined;

export const isDesktopRuntime = (): boolean =>
    (() => {
        const detectedDesktopRuntime = hasDesktopRuntimeMarker() || hasDesktopHostEnvironment();

        if (detectedDesktopRuntime) {
            rememberRuntimeMode('desktop');
            return true;
        }

        const rememberedRuntimeMode = readStableRememberedRuntimeMode();
        if (rememberedRuntimeMode === 'desktop') return true;

        rememberRuntimeMode('web');
        return false;
    })();

export const shouldRenderDesktopChrome = (capabilities: CapabilityRegistry): boolean =>
    capabilities.isDesktop || isDesktopRuntime();

const detectRuntimeMode = (): 'demo' | 'desktop' | 'web' => {
    if (isDesktopRuntime()) return 'desktop';
    if (import.meta.env.VITE_DEMO_MODE === 'true') return 'demo';
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
