type DesktopBuildIdentity = {
  readonly appName: string;
  readonly appSlug: string;
};

type VaultBillDesktopBridge = {
  readonly getAppIdentity: () => Promise<DesktopBuildIdentity>;
  readonly listRecords: () => Promise<readonly unknown[]>;
  readonly saveDraft: (request: unknown) => Promise<unknown>;
  readonly finalizeRecord: (request: unknown) => Promise<unknown>;
  readonly cancelRecord: (request: unknown) => Promise<unknown>;
  readonly configureLocalApi: (request: {
    readonly lanEnabled: boolean;
    readonly passwordRequired: boolean;
    readonly port: number;
  }) => Promise<unknown>;
  readonly platform: string;
};

declare global {
  interface Window {
    readonly vaultBillDesktop?: VaultBillDesktopBridge;
  }
}

export {};
