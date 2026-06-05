export type CapabilityRegistry = {
  readonly isDesktop: boolean;
  readonly isLanBrowser: boolean;
  readonly isWebOnly: boolean;
  readonly canListPrinters: boolean;
  readonly canSelectExactPrinter: boolean;
  readonly canBrowserPrint: boolean;
  readonly canDownloadPdf: boolean;
  readonly canBackup: boolean;
  readonly canRestore: boolean;
  readonly canUsbSignaturePad: boolean;
  readonly canLanServer: boolean;
  readonly canSmsIntegration: boolean;
  readonly canGspIntegration: boolean;
  readonly hasLocalDb: boolean;
};
