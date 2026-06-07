type DesktopBuildIdentity = {
  readonly appName: string;
  readonly appSlug: string;
};

type DesktopOperatorAccount = {
  readonly userId: string;
  readonly username: string;
  readonly displayName: string;
  readonly role: 'SysAdmin' | 'Admin' | 'User';
  readonly isActive: boolean;
  readonly passwordConfigured: boolean;
  readonly usesDefaultPassword: boolean;
};

type VaultBillDesktopBridge = {
  readonly getAppIdentity: () => Promise<DesktopBuildIdentity>;
  readonly listAccounts: () => Promise<readonly DesktopOperatorAccount[]>;
  readonly loginAccount: (userId: string, password: string) => Promise<DesktopOperatorAccount>;
  readonly saveAccount: (account: unknown) => Promise<DesktopOperatorAccount>;
  readonly archiveAccount: (userId: string) => Promise<void>;
  readonly resetPassword: (userId: string, password: string) => Promise<DesktopOperatorAccount>;
  readonly configureSysAdmin: (displayName: string) => Promise<void>;
  readonly listRecords: () => Promise<readonly unknown[]>;
  readonly saveDraft: (request: unknown) => Promise<unknown>;
  readonly finalizeRecord: (request: unknown) => Promise<unknown>;
  readonly cancelRecord: (request: unknown) => Promise<unknown>;
  readonly configureLocalApi: (request: {
    readonly lanEnabled: boolean;
    readonly passwordRequired: boolean;
    readonly port: number;
  }) => Promise<unknown>;
  readonly getTrialStatus: () => Promise<{
    readonly isFullVersion: boolean;
    readonly isExpired: boolean;
    readonly accumulatedSeconds: number;
    readonly remainingSeconds: number;
  }>;
  readonly activateLicense: (licenseKey: string) => Promise<{
    readonly isFullVersion: boolean;
    readonly isExpired: boolean;
    readonly accumulatedSeconds: number;
    readonly remainingSeconds: number;
  }>;
  readonly platform: string;
};

declare global {
  interface Window {
    readonly vaultBillDesktop?: VaultBillDesktopBridge;
  }
}

export {};
