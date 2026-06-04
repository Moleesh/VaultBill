type DesktopBuildIdentity = {
  readonly appName: string;
  readonly appSlug: string;
};

type VaultBillDesktopBridge = {
  readonly getAppIdentity: () => Promise<DesktopBuildIdentity>;
  readonly platform: string;
};

declare global {
  interface Window {
    readonly vaultBillDesktop?: VaultBillDesktopBridge;
  }
}

export {};
