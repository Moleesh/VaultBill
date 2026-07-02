/** @format */

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
    readonly getRuntimeProcessInfo: () => Promise<{
        readonly pid: number;
        readonly processName: string;
        readonly execPath: string;
        readonly cwd: string;
        readonly args: readonly string[];
        readonly appUserModelId: string;
    }>;
    readonly getHostedWebUrl: () => Promise<string>;
    readonly openHostedWeb: () => Promise<void>;
    readonly reloadWindow: () => Promise<void>;
    readonly minimizeWindow: () => Promise<void>;
    readonly closeWindow: () => Promise<void>;
    readonly listAccounts: () => Promise<readonly DesktopOperatorAccount[]>;
    readonly loginAccount: (userId: string, password: string) => Promise<DesktopOperatorAccount>;
    readonly saveAccount: (account: unknown) => Promise<DesktopOperatorAccount>;
    readonly archiveAccount: (userId: string) => Promise<void>;
    readonly resetPassword: (userId: string, password: string) => Promise<DesktopOperatorAccount>;
    readonly configureSysAdmin: (displayName: string) => Promise<void>;
    readonly completeSetup: (request: {
        readonly companyName: string;
        readonly address: string;
        readonly theme: string;
        readonly adminUsername: string;
        readonly adminDisplayName: string;
        readonly adminPassword?: string;
        readonly clearAdminPassword?: boolean;
    }) => Promise<void>;
    readonly getBusinessSettings: () => Promise<unknown>;
    readonly saveBusinessSettings: (request: unknown) => Promise<unknown>;
    readonly getSecretsSettings: () => Promise<unknown>;
    readonly saveSecretsSettings: (request: unknown) => Promise<unknown>;
    readonly getIntegrationSettings: () => Promise<unknown>;
    readonly saveIntegrationSettings: (request: unknown) => Promise<unknown>;
    readonly getBackupStatus: () => Promise<{
        readonly lastBackupAt: string | null;
    }>;
    readonly getCredentialStatus: () => Promise<{
        readonly sysAdminUsesDefaultPassword: boolean;
        readonly backupUsesDefaultPassword: boolean;
    }>;
    readonly setBackupPassword: (password: string) => Promise<{
        readonly sysAdminUsesDefaultPassword: boolean;
        readonly backupUsesDefaultPassword: boolean;
    }>;
    readonly listPrinters: () => Promise<
        readonly {
            readonly id: string;
            readonly name: string;
            readonly isDefault: boolean;
        }[]
    >;
    readonly downloadPdf: (request: {
        readonly html: string;
        readonly fileName: string;
        readonly jobId?: string;
    }) => Promise<{
        readonly success: boolean;
        readonly fileName: string;
        readonly pdfData?: Uint8Array;
        readonly warning?: string;
    }>;
    readonly printHtml: (request: {
        readonly html: string;
        readonly jobId?: string;
        readonly printerName?: string;
        readonly copies?: number;
        readonly silent?: boolean;
    }) => Promise<{ readonly success: boolean; readonly warning?: string }>;
    readonly cancelOutput: (jobId: string) => Promise<boolean>;
    readonly listRecords: () => Promise<readonly unknown[]>;
    readonly queryReport: (request: unknown) => Promise<{
        readonly rows: readonly unknown[];
        readonly total: number;
        readonly nextCursor?: string;
    }>;
    readonly saveDraft: (request: unknown) => Promise<unknown>;
    readonly finalizeRecord: (request: unknown) => Promise<unknown>;
    readonly cancelRecord: (request: unknown) => Promise<unknown>;
    readonly configureLocalApi: (request: {
        readonly lanEnabled: boolean;
        readonly passwordRequired: boolean;
        readonly port: number;
        readonly autoStart: boolean;
    }) => Promise<unknown>;
    readonly getHostedWebSettings: () => Promise<{
        readonly lanEnabled: boolean;
        readonly passwordRequired: boolean;
        readonly port: number;
        readonly autoStart: boolean;
    }>;
    readonly getHostedWebServerStatus: () => Promise<{
        readonly isRunning: boolean;
    }>;
    readonly startHostedWebServer: () => Promise<{
        readonly isRunning: boolean;
    }>;
    readonly stopHostedWebServer: () => Promise<{
        readonly isRunning: boolean;
    }>;
    readonly restartHostedWebServer: () => Promise<{
        readonly isRunning: boolean;
    }>;
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
    readonly loadBuilderPackage: (formatId?: string) => Promise<
        | {
              readonly config: unknown;
              readonly templateHtml: string;
              readonly savedTemplates: readonly {
                  readonly name: string;
                  readonly templateHtml: string;
                  readonly updatedAt: string;
              }[];
              readonly assets: readonly {
                  readonly name: string;
                  readonly type: string;
                  readonly dataBase64: string;
              }[];
          }
        | undefined
    >;
    readonly listBuilderInventory: () => Promise<
        readonly {
            readonly formatId: string;
            readonly formatName: string;
            readonly isDefault: boolean;
            readonly updatedAt: string;
            readonly templateName?: string;
            readonly assetCount: number;
            readonly isValid: boolean;
        }[]
    >;
    readonly deleteBuilderPackage: (formatId: string) => Promise<void>;
    readonly saveBuilderPackage: (builderPackage: unknown) => Promise<unknown>;
    readonly createBackup: (request: { readonly encrypted: boolean }) => Promise<{
        readonly cancelled: boolean;
        readonly filePath?: string;
        readonly recoveryKey?: string;
    }>;
    readonly restoreBackup: (request: {
        readonly password?: string;
        readonly recoveryKey?: string;
    }) => Promise<{ readonly cancelled: boolean; readonly restarting?: boolean }>;
    readonly resetApplicationData: (request: {
        readonly password: string;
        readonly confirmation: string;
    }) => Promise<{ readonly restarting: boolean }>;
    readonly platform: string;
};

declare global {
    interface Window {
        readonly vaultBillRuntime?: 'desktop';
        readonly vaultBillDesktop?: VaultBillDesktopBridge;
    }
}

export {};
