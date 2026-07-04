/** @format */

import type { BuilderInventoryItem, BuilderPackage } from './BuilderStore.js';
import type { BuildIdentity } from './BuildIdentity.js';
import type { CredentialStatus, DesktopOperatorAccount } from './CredentialStore.js';
import type { PdfRequest, PdfResult } from './PdfBridge.js';
import type { PrintRequest, PrintResult } from './PrintBridge.js';
import type { PrinterSummary } from './PrinterBridge.js';
import type {
    RecordCancelRequest,
    RecordWriteRequest,
    ReportQuery,
    ReportQueryResult,
    StoredRecord,
    TrialStatus,
} from './RecordStore.js';

export type VaultBillDesktopBridge = {
    readonly getAppIdentity: () => Promise<BuildIdentity>;
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
    readonly getBackupStatus: () => Promise<{ readonly lastBackupAt: string | null }>;
    readonly getCredentialStatus: () => Promise<CredentialStatus>;
    readonly setBackupPassword: (password: string) => Promise<CredentialStatus>;
    readonly downloadPdf: (request: PdfRequest) => Promise<PdfResult>;
    readonly listPrinters: () => Promise<readonly PrinterSummary[]>;
    readonly printHtml: (request: PrintRequest) => Promise<PrintResult>;
    readonly cancelOutput: (jobId: string) => Promise<boolean>;
    readonly listRecords: () => Promise<readonly StoredRecord[]>;
    readonly queryReport: (request: ReportQuery) => Promise<ReportQueryResult>;
    readonly saveDraft: (request: RecordWriteRequest) => Promise<StoredRecord>;
    readonly finalizeRecord: (request: RecordWriteRequest) => Promise<StoredRecord>;
    readonly cancelRecord: (request: RecordCancelRequest) => Promise<StoredRecord>;
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
    readonly getHostedWebServerStatus: () => Promise<{ readonly isRunning: boolean }>;
    readonly startHostedWebServer: () => Promise<{ readonly isRunning: boolean }>;
    readonly stopHostedWebServer: () => Promise<{ readonly isRunning: boolean }>;
    readonly restartHostedWebServer: () => Promise<{ readonly isRunning: boolean }>;
    readonly getTrialStatus: () => Promise<TrialStatus>;
    readonly activateLicense: (licenseKey: string) => Promise<TrialStatus>;
    readonly resetTrial: () => Promise<TrialStatus>;
    readonly loadBuilderPackage: (formatId?: string) => Promise<BuilderPackage | undefined>;
    readonly listBuilderInventory: () => Promise<readonly BuilderInventoryItem[]>;
    readonly deleteBuilderPackage: (formatId: string) => Promise<void>;
    readonly saveBuilderPackage: (builderPackage: unknown) => Promise<BuilderPackage>;
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
    readonly platform: NodeJS.Platform;
};
