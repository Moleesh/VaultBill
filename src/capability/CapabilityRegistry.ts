/** @format */

import { readAndroidPairingSettings } from '../runtime/AndroidPairing';
import type { CapabilityRegistry, RuntimePlatform } from './Capability.types';

const desktopRuntimeMarker = 'desktop';
const runtimeStorageKey = 'vaultbill.runtime-mode';
const androidRuntimeMarker = 'android';
let rememberedRuntimeModeInMemory: 'android' | 'desktop' | 'web' | null = null;

const hasDesktopRuntimeMarker = (): boolean =>
    new URLSearchParams(window.location.search).get('runtime') === desktopRuntimeMarker;

const hasElectronUserAgent = (): boolean => navigator.userAgent.includes('Electron');

const hasDesktopHostEnvironment = (): boolean =>
    hasElectronUserAgent() || hasDesktopRuntimeBridge();

const readRememberedRuntimeMode = (): 'android' | 'desktop' | 'web' | null => {
    try {
        const rememberedRuntimeMode = window.sessionStorage.getItem(runtimeStorageKey);
        const normalizedRuntimeMode =
            rememberedRuntimeMode === 'android' ||
            rememberedRuntimeMode === 'desktop' ||
            rememberedRuntimeMode === 'web'
                ? rememberedRuntimeMode
                : null;
        if (normalizedRuntimeMode) rememberedRuntimeModeInMemory = normalizedRuntimeMode;
        return normalizedRuntimeMode;
    } catch {
        return rememberedRuntimeModeInMemory;
    }
};

const readStableRememberedRuntimeMode = (): 'android' | 'desktop' | 'web' | null => {
    const rememberedRuntimeMode = readRememberedRuntimeMode();
    return rememberedRuntimeMode ?? rememberedRuntimeModeInMemory;
};

const rememberRuntimeMode = (runtimeMode: 'android' | 'desktop' | 'web'): void => {
    rememberedRuntimeModeInMemory = runtimeMode;
    try {
        window.sessionStorage.setItem(runtimeStorageKey, runtimeMode);
    } catch {
        // Ignore storage restrictions and continue with the in-memory runtime fallback.
    }
};

const hasDesktopRuntimeBridge = (): boolean =>
    window.vaultBillRuntime === 'desktop' || window.vaultBillDesktop !== undefined;

const hasAndroidRuntimeMarker = (): boolean =>
    new URLSearchParams(window.location.search).get('runtime') === androidRuntimeMarker;

const hasAndroidRuntimeBridge = (): boolean =>
    window.vaultBillRuntime === 'android' || window.vaultBillAndroid !== undefined;

const isAndroidRuntime = (): boolean => {
    const detectedAndroidRuntime = hasAndroidRuntimeMarker() || hasAndroidRuntimeBridge();
    if (detectedAndroidRuntime) {
        rememberRuntimeMode('android');
        return true;
    }

    return readStableRememberedRuntimeMode() === 'android';
};

const isAndroidPairedRuntime = (): boolean => {
    if (!isAndroidRuntime()) return false;
    return readAndroidPairingSettings().enabled;
};

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

const detectRuntimePlatform = (): RuntimePlatform => {
    if (isAndroidRuntime()) return isAndroidPairedRuntime() ? 'android-paired' : 'android-local';
    if (isDesktopRuntime()) return 'desktop';
    if (import.meta.env.VITE_DEMO_MODE === 'true') return 'demo';
    rememberRuntimeMode('web');
    return 'hosted-web';
};

export const buildCapabilities = (): CapabilityRegistry => {
    const runtimePlatform = detectRuntimePlatform();
    const isDesktop = runtimePlatform === 'desktop';
    const isDemoMode = runtimePlatform === 'demo';
    const isHostedWeb = runtimePlatform === 'hosted-web' || runtimePlatform === 'android-paired';
    const isAndroidLocal = runtimePlatform === 'android-local';

    return {
        runtimePlatform,
        isDesktop,
        isDemoMode,
        isHostedWeb,
        canListPrinters: isDesktop,
        canSelectExactPrinter: isDesktop,
        canBrowserPrint: true,
        canDownloadPdf: isDesktop,
        canBackup: isDesktop || isHostedWeb || isAndroidLocal,
        canRestore: isDesktop || isHostedWeb || isAndroidLocal,
        canUsbSignaturePad: isDesktop,
        canLanServer: isDesktop,
        canSmsIntegration: !isDemoMode,
        canGspIntegration: !isDemoMode,
        hasLocalDb: isDesktop || isAndroidLocal,
    };
};
