import type { CapabilityRegistry } from './Capability.types';

export const buildCapabilities = (): CapabilityRegistry => {
  const isDesktop = window.vaultBillDesktop !== undefined;
  const isWebOnly = import.meta.env.VITE_WEB_ONLY === 'true';
  const isLanBrowser = !isDesktop && !isWebOnly;

  return {
    isDesktop,
    isLanBrowser,
    isWebOnly,
    canListPrinters: isDesktop,
    canSelectExactPrinter: isDesktop,
    canBrowserPrint: true,
    canDownloadPdf: isDesktop,
    canBackup: isDesktop,
    canRestore: isDesktop,
    canUsbSignaturePad: isDesktop,
    canLanServer: isDesktop,
    canSmsIntegration: !isWebOnly,
    canGspIntegration: !isWebOnly,
    hasLocalDb: isDesktop,
  };
};
