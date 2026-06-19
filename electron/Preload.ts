/** @format */

import { contextBridge, ipcRenderer } from 'electron';

import type { BuildIdentity } from './BuildIdentity.js';
import type { BuilderInventoryItem, BuilderPackage } from './BuilderStore.js';
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
    readonly getHostedWebUrl: () => Promise<string>;
    readonly openHostedWeb: () => Promise<void>;
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
        readonly adminUsername: string;
        readonly adminDisplayName: string;
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
    }) => Promise<unknown>;
    readonly getHostedWebSettings: () => Promise<{
        readonly lanEnabled: boolean;
        readonly passwordRequired: boolean;
        readonly port: number;
    }>;
    readonly getTrialStatus: () => Promise<TrialStatus>;
    readonly activateLicense: (licenseKey: string) => Promise<TrialStatus>;
    readonly loadBuilderPackage: (formatId?: string) => Promise<BuilderPackage | undefined>;
    readonly listBuilderInventory: () => Promise<readonly BuilderInventoryItem[]>;
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

const desktopBridge: VaultBillDesktopBridge = {
    getAppIdentity: async () =>
        ipcRenderer.invoke('vaultbill:get-app-identity') as Promise<BuildIdentity>,
    getHostedWebUrl: async () => ipcRenderer.invoke('vaultbill:hosted-web:url') as Promise<string>,
    openHostedWeb: async () => {
        await ipcRenderer.invoke('vaultbill:hosted-web:open');
    },
    minimizeWindow: async () => {
        await ipcRenderer.invoke('vaultbill:window:minimize');
    },
    closeWindow: async () => {
        await ipcRenderer.invoke('vaultbill:window:close');
    },
    listAccounts: async () =>
        ipcRenderer.invoke('vaultbill:accounts:list') as Promise<readonly DesktopOperatorAccount[]>,
    loginAccount: async (userId, password) =>
        ipcRenderer.invoke(
            'vaultbill:accounts:login',
            userId,
            password,
        ) as Promise<DesktopOperatorAccount>,
    saveAccount: async (account) =>
        ipcRenderer.invoke('vaultbill:accounts:save', account) as Promise<DesktopOperatorAccount>,
    archiveAccount: async (userId) =>
        ipcRenderer.invoke('vaultbill:accounts:archive', userId) as Promise<void>,
    resetPassword: async (userId, password) =>
        ipcRenderer.invoke(
            'vaultbill:accounts:reset-password',
            userId,
            password,
        ) as Promise<DesktopOperatorAccount>,
    configureSysAdmin: async (displayName) =>
        ipcRenderer.invoke('vaultbill:setup:sysadmin', displayName) as Promise<void>,
    completeSetup: async (request) =>
        ipcRenderer.invoke('vaultbill:setup:complete', request) as Promise<void>,
    getBusinessSettings: async () =>
        ipcRenderer.invoke('vaultbill:settings:business:get') as Promise<unknown>,
    saveBusinessSettings: async (request) =>
        ipcRenderer.invoke('vaultbill:settings:business:save', request) as Promise<unknown>,
    getSecretsSettings: async () =>
        ipcRenderer.invoke('vaultbill:settings:secrets:get') as Promise<unknown>,
    saveSecretsSettings: async (request) =>
        ipcRenderer.invoke('vaultbill:settings:secrets:save', request) as Promise<unknown>,
    getIntegrationSettings: async () =>
        ipcRenderer.invoke('vaultbill:settings:integrations:get') as Promise<unknown>,
    saveIntegrationSettings: async (request) =>
        ipcRenderer.invoke('vaultbill:settings:integrations:save', request) as Promise<unknown>,
    getBackupStatus: async () =>
        ipcRenderer.invoke('vaultbill:settings:backup:status') as Promise<{
            readonly lastBackupAt: string | null;
        }>,
    getCredentialStatus: async () =>
        ipcRenderer.invoke('vaultbill:credentials:status') as Promise<CredentialStatus>,
    setBackupPassword: async (password) =>
        ipcRenderer.invoke(
            'vaultbill:credentials:set-backup-password',
            password,
        ) as Promise<CredentialStatus>,
    downloadPdf: async (request) =>
        ipcRenderer.invoke('vaultbill:download-pdf', request) as Promise<PdfResult>,
    listPrinters: async () =>
        ipcRenderer.invoke('vaultbill:list-printers') as Promise<readonly PrinterSummary[]>,
    printHtml: async (request) =>
        ipcRenderer.invoke('vaultbill:print-html', request) as Promise<PrintResult>,
    cancelOutput: async (jobId) =>
        ipcRenderer.invoke('vaultbill:output:cancel', jobId) as Promise<boolean>,
    listRecords: async () =>
        ipcRenderer.invoke('vaultbill:records:list') as Promise<readonly StoredRecord[]>,
    queryReport: async (request) =>
        ipcRenderer.invoke('vaultbill:reports:query', request) as Promise<ReportQueryResult>,
    saveDraft: async (request) =>
        ipcRenderer.invoke('vaultbill:records:save-draft', request) as Promise<StoredRecord>,
    finalizeRecord: async (request) =>
        ipcRenderer.invoke('vaultbill:records:finalize', request) as Promise<StoredRecord>,
    cancelRecord: async (request) =>
        ipcRenderer.invoke('vaultbill:records:cancel', request) as Promise<StoredRecord>,
    configureLocalApi: async (request) =>
        ipcRenderer.invoke('vaultbill:local-api:configure', request) as Promise<unknown>,
    getHostedWebSettings: async () =>
        ipcRenderer.invoke('vaultbill:local-api:settings') as Promise<{
            readonly lanEnabled: boolean;
            readonly passwordRequired: boolean;
            readonly port: number;
        }>,
    getTrialStatus: async () =>
        ipcRenderer.invoke('vaultbill:trial:status') as Promise<TrialStatus>,
    activateLicense: async (licenseKey) =>
        ipcRenderer.invoke('vaultbill:trial:activate', licenseKey) as Promise<TrialStatus>,
    loadBuilderPackage: async (formatId) =>
        ipcRenderer.invoke('vaultbill:builder:load', formatId) as Promise<
            BuilderPackage | undefined
        >,
    listBuilderInventory: async () =>
        ipcRenderer.invoke('vaultbill:builder:inventory') as Promise<
            readonly BuilderInventoryItem[]
        >,
    saveBuilderPackage: async (builderPackage) =>
        ipcRenderer.invoke('vaultbill:builder:save', builderPackage) as Promise<BuilderPackage>,
    createBackup: async (request) =>
        ipcRenderer.invoke('vaultbill:backup:create', request) as Promise<{
            readonly cancelled: boolean;
            readonly filePath?: string;
            readonly recoveryKey?: string;
        }>,
    restoreBackup: async (request) =>
        ipcRenderer.invoke('vaultbill:backup:restore', request) as Promise<{
            readonly cancelled: boolean;
            readonly restarting?: boolean;
        }>,
    resetApplicationData: async (request) =>
        ipcRenderer.invoke('vaultbill:application:reset', request) as Promise<{
            readonly restarting: boolean;
        }>,
    platform: process.platform,
};

contextBridge.exposeInMainWorld('vaultBillRuntime', 'desktop');
contextBridge.exposeInMainWorld('vaultBillDesktop', desktopBridge);
