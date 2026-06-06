import type { CapabilityRegistry } from './Capability.types';

export const buildCapabilities = (): CapabilityRegistry => {
  const isDesktop = window.vaultBillDesktop !== undefined;
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
  const isLanBrowser = !isDesktop && !isDemoMode;

  return {
    isDesktop,
    isLanBrowser,
    isDemoMode,
    canListPrinters: isDesktop,
    canSelectExactPrinter: isDesktop,
    canBrowserPrint: true,
    canDownloadPdf: isDesktop,
    canBackup: isDesktop,
    canRestore: isDesktop,
    canUsbSignaturePad: isDesktop,
    canLanServer: isDesktop,
    canSmsIntegration: !isDemoMode,
    canGspIntegration: !isDemoMode,
    hasLocalDb: isDesktop,
  };
};
