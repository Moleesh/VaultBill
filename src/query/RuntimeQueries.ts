/** @format */
/* eslint-disable max-lines */

import type { CapabilityRegistry } from '../capability/Capability.types';
import { bootstrapOperatorAccounts } from '../features/auth/AccountBootstrap';
import type { OperatorAccount, OperatorContext } from '../features/auth/AccountTypes';
import {
    defaultPasswordHash,
    demoAccount,
    fallbackBrowserAccounts,
    getStoredOperatorId,
    hashPassword,
    validateManagedAccounts,
    type HostedSessionPayload,
} from '../features/auth/SessionSupport';
import {
    sortBuilderInventory,
    type BuilderInventoryItem,
} from '../features/builder/BuilderDocumentLibrarySupport';
import type { DocumentFormatConfig } from '../features/builder/BuilderPageControllerSupport';
import type {
    AssetSummary,
    SavedPrintTemplate,
    StoredBuilderPackage,
} from '../features/builder/BuilderPageSupport';
import {
    listBrowserBuilderInventory,
    readBrowserBuilderPackage,
    readBuilderAssets,
    readConfig,
    removeBrowserBuilderPackage,
    readSavedTemplates,
    readTemplateHtml,
    writeBuilderPackage,
} from '../features/builder/BuilderPageSupport';
import {
    AppRecordSchema,
    buildStoredRecord,
    readBrowserRecords,
    sortLatestFirst,
    type AppRecord,
    type EditableRecord,
} from '../features/records/RecordStoreSupport';
import {
    defaultSecretsSettings,
    normalizeSecretsSettings,
    type SecretsSettings,
} from '../features/settings/SettingsSecretsSectionSupport';
import type {
    CredentialStatus,
    TrialStatus,
} from '../features/settings/SettingsSecuritySectionStateSupport';
import {
    canUseLocalHostedApi,
    createHostedBackup,
    isHostedApiErrorStatus,
    requestHostedApi,
    restoreHostedBackup,
} from '../runtime/HostedApi';
import { canUseDbBackedRuntime } from '../runtime/RuntimeMode';
import {
    defaultWorkspaceSettings,
    loadWorkspaceSettings,
    normalizeWorkspaceSettings,
    saveLocalWorkspaceSettings,
    type WorkspaceSettings,
} from '../runtime/WorkspaceSettings';

import type { PublishedFormat } from '../features/records/useRecordsPageStateSupport';

export type SetupStatusSnapshot = {
    readonly isSetupRequired: boolean;
};

export type SetupDefaultsSnapshot = {
    readonly business: WorkspaceSettings;
    readonly accounts: readonly OperatorAccount[];
};

export type SecurityRuntimeStateSnapshot = {
    readonly credentialStatus: CredentialStatus | undefined;
    readonly lanEnabled: boolean;
    readonly hostedWebAutoStart: boolean;
    readonly hostedWebServerRunning: boolean;
    readonly trialStatus: TrialStatus | undefined;
};

export type SessionSnapshot = {
    readonly accounts: readonly OperatorAccount[];
    readonly account: OperatorAccount | undefined;
    readonly csrfToken: string | undefined;
};

export type InventoryItem = {
    readonly formatId: string;
    readonly formatName: string;
    readonly isDefault: boolean;
    readonly updatedAt: string;
    readonly templateName?: string;
    readonly assetCount: number;
    readonly isValid: boolean;
};

export type HostedRecordSummary = {
    readonly status: string;
};

export type HostedAccountSummary = {
    readonly isActive: boolean;
};

export type SysAdminSummary = {
    readonly formatCount: number;
    readonly defaultFormatCount: number;
    readonly templateCount: number;
    readonly incompleteFormatCount: number;
    readonly recordCount: number;
    readonly draftCount: number;
    readonly finalizedCount: number;
    readonly cancelledCount: number;
    readonly accountCount: number;
    readonly activeAccountCount: number;
    readonly lastBackupAt: string | null;
    readonly trialRemainingSeconds: number;
    readonly isTrialExpired: boolean;
    readonly isFullVersion: boolean;
};

export type SysAdminDashboardState = {
    readonly inventory: readonly InventoryItem[];
    readonly summary: SysAdminSummary;
    readonly message: string;
};

export type ReportPageSnapshot = {
    readonly rows: readonly AppRecord[];
    readonly total: number;
    readonly nextCursor?: string;
};

const canUseHostedRecordsApi = ({
    capabilities,
    usesStaticHostedBrowserBuild,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
    readonly usesStaticHostedBrowserBuild: boolean;
}) => !usesStaticHostedBrowserBuild && (capabilities.isHostedWeb || canUseLocalHostedApi());

type QueryCapabilities = Pick<
    CapabilityRegistry,
    'hasLocalDb' | 'isDemoMode' | 'isDesktop' | 'isHostedWeb' | 'runtimePlatform'
>;

const defaultSysAdminSummary: SysAdminSummary = {
    formatCount: 0,
    defaultFormatCount: 0,
    templateCount: 0,
    incompleteFormatCount: 0,
    recordCount: 0,
    draftCount: 0,
    finalizedCount: 0,
    cancelledCount: 0,
    accountCount: 0,
    activeAccountCount: 0,
    lastBackupAt: null,
    trialRemainingSeconds: 0,
    isTrialExpired: false,
    isFullVersion: false,
};

const localSetupAccountsStorageKey = 'vaultbill.local-setup-accounts';

const readLocalSetupAccounts = (): readonly OperatorAccount[] => {
    try {
        return (
            JSON.parse(
                window.localStorage.getItem(localSetupAccountsStorageKey) ??
                    JSON.stringify(bootstrapOperatorAccounts),
            ) as readonly OperatorAccount[]
        ).filter((account) => account.userId && account.username && account.displayName);
    } catch {
        return bootstrapOperatorAccounts;
    }
};

const writeLocalSetupAccounts = (accounts: readonly OperatorAccount[]): void => {
    window.localStorage.setItem(localSetupAccountsStorageKey, JSON.stringify(accounts));
};

const buildSysAdminSummary = (
    inventory: readonly InventoryItem[],
    records: readonly HostedRecordSummary[],
    accounts: readonly HostedAccountSummary[],
    backupStatus: { readonly lastBackupAt: string | null },
    trialStatus: {
        readonly remainingSeconds: number;
        readonly isExpired: boolean;
        readonly isFullVersion: boolean;
    },
): SysAdminSummary => ({
    formatCount: inventory.length,
    defaultFormatCount: inventory.filter((item) => item.isDefault).length,
    templateCount: inventory.filter((item) => item.templateName).length,
    incompleteFormatCount: inventory.filter((item) => !item.isValid || !item.templateName).length,
    recordCount: records.length,
    draftCount: records.filter((record) => record.status === 'Draft').length,
    finalizedCount: records.filter((record) => record.status === 'Finalized').length,
    cancelledCount: records.filter((record) => record.status === 'Cancelled').length,
    accountCount: accounts.length,
    activeAccountCount: accounts.filter((account) => account.isActive).length,
    lastBackupAt: backupStatus.lastBackupAt,
    trialRemainingSeconds: trialStatus.remainingSeconds,
    isTrialExpired: trialStatus.isExpired,
    isFullVersion: trialStatus.isFullVersion,
});

/** Reads the hosted browser session bootstrap payload without requiring a login. */
const readHostedSessionSnapshot = async (): Promise<SessionSnapshot> => {
    const session = await requestHostedApi<{
        readonly accounts: readonly OperatorAccount[];
        readonly account?: OperatorAccount;
        readonly csrfToken?: string;
    }>('/auth/snapshot');

    return {
        accounts: session.accounts,
        account: session.account,
        csrfToken: session.csrfToken,
    };
};

/** Reuses the hosted session snapshot as the single active-account source for hosted pages. */
const readHostedAccountsSnapshot = async (): Promise<readonly OperatorAccount[]> =>
    (await readHostedSessionSnapshot()).accounts;

const readDesktopSetupStatus = async (): Promise<SetupStatusSnapshot> => {
    if (!window.vaultBillDesktop) return { isSetupRequired: false };

    const [accounts, business] = await Promise.all([
        window.vaultBillDesktop.listAccounts(),
        window.vaultBillDesktop.getBusinessSettings(),
    ]);
    const normalizedBusiness = business as {
        readonly companyName: string;
        readonly address: string;
    };

    const hasActiveAdmin = accounts.some((account) => account.role === 'Admin' && account.isActive);
    const isConfiguredBusiness =
        normalizedBusiness.companyName.trim().length > 0 &&
        normalizedBusiness.address.trim().length > 0;

    return { isSetupRequired: !hasActiveAdmin || !isConfiguredBusiness };
};

export const fetchSetupStatus = async (
    capabilities: QueryCapabilities,
): Promise<SetupStatusSnapshot> => {
    if (!canUseDbBackedRuntime(capabilities)) return { isSetupRequired: false };

    const canUseHostedSetupStatus = capabilities.isHostedWeb || canUseLocalHostedApi();
    if (!canUseHostedSetupStatus) {
        if (window.vaultBillDesktop) return readDesktopSetupStatus();
        const business = await loadWorkspaceSettings(false);
        const accounts = readLocalSetupAccounts();
        const hasActiveAdmin = accounts.some(
            (account) => account.role === 'Admin' && account.isActive,
        );
        const isConfiguredBusiness =
            business.companyName.trim().length > 0 && business.address.trim().length > 0;
        return { isSetupRequired: !hasActiveAdmin || !isConfiguredBusiness };
    }

    try {
        const status = await requestHostedApi<{
            readonly hasActiveAdmin: boolean;
            readonly business: {
                readonly companyName: string;
                readonly address: string;
            };
        }>('/setup/status');
        const isConfiguredBusiness =
            status.business.companyName.trim().length > 0 &&
            status.business.address.trim().length > 0;
        return { isSetupRequired: !status.hasActiveAdmin || !isConfiguredBusiness };
    } catch {
        return readDesktopSetupStatus();
    }
};

export const fetchSetupDefaults = async ({
    capabilities,
    canUseHostedSetupApi,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
    readonly canUseHostedSetupApi: boolean;
}): Promise<SetupDefaultsSnapshot> => {
    const fallbackBusiness = defaultWorkspaceSettings;
    const fallbackAccounts: readonly OperatorAccount[] = [];

    if (window.vaultBillDesktop) {
        const [business, accounts] = await Promise.all([
            window.vaultBillDesktop.getBusinessSettings(),
            window.vaultBillDesktop.listAccounts(),
        ]);
        return {
            business: normalizeWorkspaceSettings(business),
            accounts,
        };
    }

    if (capabilities.isHostedWeb || canUseHostedSetupApi) {
        const [business, accounts] = await Promise.all([
            requestHostedApi('/workspace/settings').catch(() => fallbackBusiness),
            readHostedAccountsSnapshot().catch(() => fallbackAccounts),
        ]);
        return {
            business: normalizeWorkspaceSettings(business),
            accounts,
        };
    }

    return {
        business: await loadWorkspaceSettings(false),
        accounts: readLocalSetupAccounts(),
    };
};

export const completeRuntimeSetup = async ({
    capabilities,
    canUseHostedSetupApi,
    selectedTheme,
    value,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
    readonly canUseHostedSetupApi: boolean;
    readonly selectedTheme: string;
    readonly value: {
        readonly companyName: string;
        readonly address: string;
        readonly adminUsername: string;
        readonly adminDisplayName: string;
        readonly adminPassword: string;
        readonly clearAdminPassword: boolean;
    };
}): Promise<void> => {
    const request = {
        companyName: value.companyName.trim(),
        address: value.address.trim(),
        theme: selectedTheme,
        adminUsername: value.adminUsername.trim(),
        adminDisplayName: value.adminDisplayName.trim(),
        adminPassword: value.adminPassword.trim(),
        clearAdminPassword: value.clearAdminPassword,
    };

    if (window.vaultBillDesktop) {
        await window.vaultBillDesktop.completeSetup(request);
        return;
    }

    if (capabilities.isHostedWeb || canUseHostedSetupApi) {
        await requestHostedApi('/setup/complete', 'POST', request);
        return;
    }

    saveLocalWorkspaceSettings({
        ...defaultWorkspaceSettings,
        companyName: request.companyName,
        address: request.address,
        theme: request.theme,
    });
    writeLocalSetupAccounts([
        {
            userId: 'sysadmin_1',
            username: 'sysadmin',
            displayName: 'System Administrator',
            role: 'SysAdmin',
            isActive: true,
            ...(request.clearAdminPassword ? {} : { passwordHash: defaultPasswordHash }),
        },
        {
            userId: 'admin_1',
            username: request.adminUsername,
            displayName: request.adminDisplayName,
            role: 'Admin',
            isActive: true,
            ...(request.adminPassword
                ? { passwordHash: await hashPassword(request.adminPassword) }
                : {}),
        },
    ]);
};

export const fetchSessionSnapshot = async ({
    canUseHostedSessionApi,
    usesStaticHostedBrowserBuild,
}: {
    readonly canUseHostedSessionApi: boolean;
    readonly usesStaticHostedBrowserBuild: boolean;
}): Promise<SessionSnapshot> => {
    if (usesStaticHostedBrowserBuild) {
        return {
            accounts: [demoAccount],
            account: undefined,
            csrfToken: undefined,
        };
    }

    if (window.vaultBillDesktop) {
        const desktopAccounts = await window.vaultBillDesktop.listAccounts();
        const storedOperatorId = getStoredOperatorId();
        const restoredAccount =
            desktopAccounts.find(
                (account) => account.isActive && account.userId === storedOperatorId,
            ) ?? undefined;
        if (desktopAccounts.some((account) => account.isActive)) {
            return {
                accounts: desktopAccounts,
                account: restoredAccount,
                csrfToken: undefined,
            };
        }

        return {
            accounts: desktopAccounts,
            account: undefined,
            csrfToken: undefined,
        };
    }

    if (canUseHostedSessionApi) {
        return readHostedSessionSnapshot();
    }

    return {
        accounts: readLocalSetupAccounts(),
        account: undefined,
        csrfToken: undefined,
    };
};

export const loginRuntimeSession = async ({
    accounts,
    canUseHostedSessionApi,
    password = '',
    userId,
}: {
    readonly accounts: readonly OperatorAccount[];
    readonly canUseHostedSessionApi: boolean;
    readonly password?: string;
    readonly userId: string;
}): Promise<{
    readonly account: OperatorAccount;
    readonly csrfToken: string | undefined;
}> => {
    let selectedAccount =
        accounts.find((candidate) => candidate.userId === userId && candidate.isActive) ??
        undefined;

    if (!selectedAccount) {
        throw new Error('The selected operator account is unavailable.');
    }

    if (window.vaultBillDesktop) {
        selectedAccount = await window.vaultBillDesktop.loginAccount(userId, password);
        return {
            account: selectedAccount,
            csrfToken: undefined,
        };
    }

    if (canUseHostedSessionApi) {
        const hostedSession = await requestHostedApi<HostedSessionPayload>('/auth/login', 'POST', {
            userId,
            password,
        });
        return {
            account: hostedSession.account,
            csrfToken: hostedSession.csrfToken,
        };
    }

    if (selectedAccount.passwordHash) {
        const suppliedHash = await hashPassword(password);
        if (suppliedHash !== selectedAccount.passwordHash) {
            throw new Error('The password is incorrect.');
        }
    }

    return {
        account: selectedAccount,
        csrfToken: undefined,
    };
};

export const logoutRuntimeSession = async ({
    canUseHostedSessionApi,
}: {
    readonly canUseHostedSessionApi: boolean;
}): Promise<void> => {
    if (canUseHostedSessionApi) {
        await requestHostedApi('/auth/logout', 'POST');
    }
};

export const saveRuntimeAccount = async ({
    accounts,
    canUseHostedSessionApi,
    nextAccount,
}: {
    readonly accounts: readonly OperatorAccount[];
    readonly canUseHostedSessionApi: boolean;
    readonly nextAccount: OperatorAccount;
}): Promise<{
    readonly nextAccounts: readonly OperatorAccount[];
    readonly savedAccount: OperatorAccount;
}> => {
    const existing = accounts.find((candidate) => candidate.userId === nextAccount.userId);
    const baseAccounts = accounts.length > 0 ? accounts : fallbackBrowserAccounts;
    const nextAccounts = existing
        ? baseAccounts.map((candidate) =>
              candidate.userId === nextAccount.userId ? nextAccount : candidate,
          )
        : [...baseAccounts, nextAccount];
    const validation = validateManagedAccounts(nextAccounts);
    if (validation) {
        throw new Error(validation);
    }

    if (window.vaultBillDesktop) {
        const saved = await window.vaultBillDesktop.saveAccount(nextAccount);
        return {
            nextAccounts: nextAccounts.map((candidate) =>
                candidate.userId === saved.userId ? saved : candidate,
            ),
            savedAccount: saved,
        };
    }

    if (canUseHostedSessionApi) {
        const saved = await requestHostedApi<OperatorAccount>(
            '/accounts/save',
            'POST',
            nextAccount,
        );
        return {
            nextAccounts: nextAccounts.map((candidate) =>
                candidate.userId === saved.userId ? saved : candidate,
            ),
            savedAccount: saved,
        };
    }

    writeLocalSetupAccounts(nextAccounts);
    return {
        nextAccounts,
        savedAccount: nextAccount,
    };
};

export const archiveRuntimeAccount = async ({
    accounts,
    canUseHostedSessionApi,
    userId,
}: {
    readonly accounts?: readonly OperatorAccount[];
    readonly canUseHostedSessionApi: boolean;
    readonly userId: string;
}): Promise<string> => {
    if (userId === 'sysadmin_1') {
        throw new Error('The System Administrator cannot be removed.');
    }

    if (window.vaultBillDesktop) {
        await window.vaultBillDesktop.archiveAccount(userId);
        return userId;
    }

    if (canUseHostedSessionApi) {
        await requestHostedApi('/accounts/archive', 'POST', { userId });
    }

    if (accounts) {
        writeLocalSetupAccounts(
            accounts.map((account) =>
                account.userId === userId ? { ...account, isActive: false } : account,
            ),
        );
    }

    return userId;
};

export const resetRuntimeAccountPassword = async ({
    accounts,
    canUseHostedSessionApi,
    password,
    userId,
    usesStaticHostedBrowserBuild,
}: {
    readonly accounts: readonly OperatorAccount[];
    readonly canUseHostedSessionApi: boolean;
    readonly password: string;
    readonly userId: string;
    readonly usesStaticHostedBrowserBuild: boolean;
}): Promise<OperatorAccount> => {
    if (window.vaultBillDesktop) {
        return window.vaultBillDesktop.resetPassword(userId, password);
    }

    if (canUseHostedSessionApi) {
        return requestHostedApi<OperatorAccount>('/accounts/reset-password', 'POST', {
            userId,
            password,
        });
    }

    if (!usesStaticHostedBrowserBuild) {
        throw new Error('Password reset is unavailable in this runtime.');
    }

    const passwordHash = await hashPassword(password);
    const savedAccount = accounts.find((candidate) => candidate.userId === userId);
    if (!savedAccount) {
        throw new Error('The selected operator account is unavailable.');
    }

    const nextAccount = {
        ...savedAccount,
        passwordHash,
        usesDefaultPassword: passwordHash === defaultPasswordHash,
    } satisfies OperatorAccount;
    writeLocalSetupAccounts(
        accounts.map((account) => (account.userId === nextAccount.userId ? nextAccount : account)),
    );
    return nextAccount;
};

export const fetchTrialStatus = async ({
    capabilities,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
}) => {
    if (window.vaultBillDesktop) {
        return window.vaultBillDesktop.getTrialStatus();
    }
    if (capabilities.isHostedWeb) {
        return requestHostedApi<
            Awaited<ReturnType<NonNullable<typeof window.vaultBillDesktop>['getTrialStatus']>>
        >('/trial/status');
    }
    return undefined;
};

export const fetchHostedWebUrl = async ({
    capabilities,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
}): Promise<string> => {
    if (window.vaultBillDesktop) {
        return window.vaultBillDesktop.getHostedWebUrl();
    }
    if (capabilities.isHostedWeb) return window.location.origin;
    return '';
};

export const fetchSysAdminDashboardState = async ({
    accounts,
    capabilities,
}: {
    readonly accounts?: readonly HostedAccountSummary[];
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
}): Promise<SysAdminDashboardState> => {
    if (window.vaultBillDesktop) {
        const [inventory, records, accounts, backupStatus, trialStatus] = await Promise.all([
            window.vaultBillDesktop.listBuilderInventory(),
            window.vaultBillDesktop.listRecords(),
            window.vaultBillDesktop.listAccounts(),
            window.vaultBillDesktop.getBackupStatus(),
            window.vaultBillDesktop.getTrialStatus(),
        ]);

        return {
            inventory,
            summary: buildSysAdminSummary(
                inventory,
                records as readonly HostedRecordSummary[],
                accounts,
                backupStatus,
                trialStatus,
            ),
            message: '',
        };
    }

    if (capabilities.isHostedWeb) {
        const [inventory, records, hostedAccounts, backupStatus, trialStatus] = await Promise.all([
            requestHostedApi<readonly InventoryItem[]>('/builder/inventory'),
            requestHostedApi<readonly HostedRecordSummary[]>('/records'),
            accounts ? Promise.resolve(accounts) : readHostedAccountsSnapshot(),
            requestHostedApi<{ readonly lastBackupAt: string | null }>('/backup/status'),
            requestHostedApi<{
                readonly isFullVersion: boolean;
                readonly isExpired: boolean;
                readonly remainingSeconds: number;
            }>('/trial/status'),
        ]);

        return {
            inventory,
            summary: buildSysAdminSummary(inventory, records, hostedAccounts, backupStatus, {
                remainingSeconds: trialStatus.remainingSeconds,
                isExpired: trialStatus.isExpired,
                isFullVersion: trialStatus.isFullVersion,
            }),
            message: '',
        };
    }

    return {
        inventory: [],
        summary: defaultSysAdminSummary,
        message: '',
    };
};

export const fetchSecurityRuntimeState = async ({
    capabilities,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
}): Promise<SecurityRuntimeStateSnapshot> => {
    if (window.vaultBillDesktop) {
        const [credentialStatus, trialStatus, hostedWebSettings, hostedWebServerStatus] =
            await Promise.all([
                window.vaultBillDesktop.getCredentialStatus(),
                window.vaultBillDesktop.getTrialStatus(),
                window.vaultBillDesktop.getHostedWebSettings(),
                window.vaultBillDesktop.getHostedWebServerStatus(),
            ]);
        return {
            credentialStatus,
            lanEnabled: hostedWebSettings.lanEnabled,
            hostedWebAutoStart: hostedWebSettings.autoStart,
            hostedWebServerRunning: hostedWebServerStatus.isRunning,
            trialStatus,
        };
    }
    if (capabilities.isHostedWeb) {
        const [credentialStatus, trialStatus] = await Promise.all([
            requestHostedApi<CredentialStatus>('/credentials/status'),
            requestHostedApi<TrialStatus>('/trial/status'),
        ]);
        return {
            credentialStatus,
            lanEnabled: false,
            hostedWebAutoStart: false,
            hostedWebServerRunning: false,
            trialStatus,
        };
    }
    return {
        credentialStatus: undefined,
        lanEnabled: false,
        hostedWebAutoStart: false,
        hostedWebServerRunning: false,
        trialStatus: undefined,
    };
};

export const fetchWorkspaceSettings = async ({
    capabilities,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
}): Promise<WorkspaceSettings> => {
    if (window.vaultBillDesktop) {
        return normalizeWorkspaceSettings(await window.vaultBillDesktop.getBusinessSettings());
    }
    if (capabilities.isHostedWeb) {
        return normalizeWorkspaceSettings(await requestHostedApi('/settings/business'));
    }
    return defaultWorkspaceSettings;
};

export const saveWorkspaceSettings = async ({
    capabilities,
    settings,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
    readonly settings: WorkspaceSettings;
}): Promise<void> => {
    if (window.vaultBillDesktop) {
        await window.vaultBillDesktop.saveBusinessSettings(settings);
        return;
    }
    if (capabilities.isHostedWeb) {
        await requestHostedApi('/settings/business', 'POST', settings);
    }
};

export const saveIncludeDraftsInReports = async ({
    capabilities,
    value,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
    readonly value: boolean;
}): Promise<WorkspaceSettings> => {
    const current = await fetchWorkspaceSettings({ capabilities });
    const nextSettings = { ...current, includeDraftsInReports: value };
    await saveWorkspaceSettings({
        capabilities,
        settings: nextSettings,
    });
    return nextSettings;
};

export type RuntimeBackupResult = {
    readonly success: boolean;
    readonly warning?: string;
    readonly recoveryKey?: string;
    readonly filePath?: string;
    readonly downloadBlob?: Blob;
    readonly downloadFileName?: string;
};

/** Updates the backup encryption password through the active runtime transport. */
export const updateRuntimeBackupPassword = async ({
    backupPassword,
    capabilities,
}: {
    readonly backupPassword: string;
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
}): Promise<void> => {
    if (window.vaultBillDesktop) {
        await window.vaultBillDesktop.setBackupPassword(backupPassword);
        return;
    }

    if (capabilities.isHostedWeb) {
        await requestHostedApi('/credentials/backup-password', 'POST', { backupPassword });
        return;
    }

    throw new Error('Backup password updates are unavailable in this runtime.');
};

/** Creates a backup and normalizes desktop and hosted-web results for callers. */
export const createRuntimeBackup = async ({
    capabilities,
    encryptBackup,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
    readonly encryptBackup: boolean;
}): Promise<RuntimeBackupResult> => {
    if (window.vaultBillDesktop) {
        const result = await window.vaultBillDesktop.createBackup({ encrypted: encryptBackup });
        if (result.cancelled) {
            return { success: false, warning: 'Backup creation cancelled.' };
        }

        return {
            success: true,
            ...(result.filePath ? { filePath: result.filePath } : {}),
            ...(result.recoveryKey ? { recoveryKey: result.recoveryKey } : {}),
        };
    }

    if (capabilities.isHostedWeb) {
        const result = await createHostedBackup(encryptBackup);
        return {
            success: true,
            filePath: result.fileName,
            downloadBlob: result.blob,
            downloadFileName: result.fileName,
            ...(result.recoveryKey ? { recoveryKey: result.recoveryKey } : {}),
        };
    }

    throw new Error('Backups are unavailable in this runtime.');
};

/** Restores a backup archive through desktop or hosted-web runtime support. */
export const restoreRuntimeBackup = async ({
    capabilities,
    restoreFile,
    restorePassword,
    restoreRecoveryKey,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
    readonly restoreFile: File;
    readonly restorePassword: string;
    readonly restoreRecoveryKey: string;
}): Promise<void> => {
    if (window.vaultBillDesktop) {
        await window.vaultBillDesktop.restoreBackup({
            ...(restorePassword ? { password: restorePassword } : {}),
            ...(restoreRecoveryKey ? { recoveryKey: restoreRecoveryKey } : {}),
        });
        return;
    }

    if (capabilities.isHostedWeb) {
        await restoreHostedBackup(restoreFile, {
            ...(restorePassword ? { backupPassword: restorePassword } : {}),
            ...(restoreRecoveryKey ? { recoveryKey: restoreRecoveryKey } : {}),
        });
        return;
    }

    throw new Error('Backup restore is unavailable in this runtime.');
};

/** Resets workspace data after the runtime has confirmed administrator intent. */
export const resetRuntimeApplicationData = async ({
    capabilities,
    resetConfirmation,
    resetSysAdminPassword,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
    readonly resetConfirmation: string;
    readonly resetSysAdminPassword: string;
}): Promise<void> => {
    if (window.vaultBillDesktop) {
        await window.vaultBillDesktop.resetApplicationData({
            password: resetSysAdminPassword,
            confirmation: resetConfirmation,
        });
        return;
    }

    if (capabilities.isHostedWeb) {
        await requestHostedApi('/application/reset', 'POST', {
            currentPassword: resetSysAdminPassword,
            confirmation: resetConfirmation,
        });
        return;
    }

    throw new Error('Application reset is unavailable in this runtime.');
};

export const fetchWorkspacePrinters = async (): Promise<
    readonly {
        readonly id: string;
        readonly name: string;
        readonly isDefault: boolean;
    }[]
> => {
    if (!window.vaultBillDesktop?.listPrinters) return [];
    return window.vaultBillDesktop.listPrinters();
};

const mergeBuiltInBuilderInventory = (
    inventory: readonly BuilderInventoryItem[],
): readonly BuilderInventoryItem[] => {
    const storedDefault = inventory.find((item) => item.isDefault);
    const merged = new Map<string, BuilderInventoryItem>();
    for (const builtIn of listBrowserBuilderInventory()) {
        merged.set(builtIn.formatId, builtIn);
    }
    for (const item of inventory) {
        merged.set(item.formatId, item);
    }
    if (storedDefault) {
        return sortBuilderInventory(
            [...merged.values()].map((item) => ({
                ...item,
                isDefault: item.formatId === storedDefault.formatId,
                isEnabled: item.formatId === storedDefault.formatId ? true : item.isEnabled,
            })),
        );
    }
    return sortBuilderInventory(
        [...merged.values()].map((item, index) => ({
            ...item,
            isDefault: index === 0,
            isEnabled: item.isEnabled || index === 0,
        })),
    );
};

export const fetchPublishedFormats = async ({
    capabilities,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
}): Promise<readonly PublishedFormat[]> => {
    const toEnabledFormats = (inventory: readonly BuilderInventoryItem[]) =>
        mergeBuiltInBuilderInventory(inventory)
            .filter((format) => format.isEnabled)
            .map((format) => ({
                formatId: format.formatId,
                formatName: format.formatName,
                isDefault: format.isDefault,
            }));

    if (window.vaultBillDesktop) {
        return toEnabledFormats(await window.vaultBillDesktop.listBuilderInventory());
    }
    if (capabilities.isHostedWeb) {
        return toEnabledFormats(
            await requestHostedApi<readonly BuilderInventoryItem[]>('/print/formats'),
        );
    }
    return toEnabledFormats(listBrowserBuilderInventory());
};

export const fetchStoredRecords = async ({
    capabilities,
    sessionOperator,
    usesStaticHostedBrowserBuild,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
    readonly sessionOperator: OperatorContext | undefined;
    readonly usesStaticHostedBrowserBuild: boolean;
}): Promise<readonly AppRecord[]> => {
    const desktopApi = window.vaultBillDesktop;
    if (desktopApi) {
        return sortLatestFirst(AppRecordSchema.array().parse(await desktopApi.listRecords()));
    }

    if (canUseHostedRecordsApi({ capabilities, usesStaticHostedBrowserBuild })) {
        if (!sessionOperator) return [];
        const storedRecords = await requestHostedApi('/records');
        return sortLatestFirst(AppRecordSchema.array().parse(storedRecords));
    }

    return readBrowserRecords(usesStaticHostedBrowserBuild);
};

export const saveDraftRuntimeRecord = async ({
    capabilities,
    existing,
    input,
    operatorContext,
    usesStaticHostedBrowserBuild,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
    readonly existing: AppRecord | undefined;
    readonly input: EditableRecord;
    readonly operatorContext: OperatorContext;
    readonly usesStaticHostedBrowserBuild: boolean;
}): Promise<AppRecord> => {
    if (existing && existing.status !== 'Draft') {
        throw new Error('Finalized and cancelled records are read-only.');
    }

    const desktopApi = window.vaultBillDesktop;
    if (desktopApi) {
        return AppRecordSchema.parse(
            await desktopApi.saveDraft({ record: input, operatorContext }),
        );
    }

    if (canUseHostedRecordsApi({ capabilities, usesStaticHostedBrowserBuild })) {
        return AppRecordSchema.parse(
            await requestHostedApi('/records/draft', 'POST', { record: input }),
        );
    }

    return buildStoredRecord(input, operatorContext, existing, 'Draft');
};

export const finalizeRuntimeRecord = async ({
    capabilities,
    existing,
    input,
    operatorContext,
    usesStaticHostedBrowserBuild,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
    readonly existing: AppRecord | undefined;
    readonly input: EditableRecord;
    readonly operatorContext: OperatorContext;
    readonly usesStaticHostedBrowserBuild: boolean;
}): Promise<AppRecord> => {
    if (existing?.status !== 'Draft') {
        throw new Error('Save the current document as a Draft before finalizing it.');
    }

    const desktopApi = window.vaultBillDesktop;
    if (desktopApi) {
        return AppRecordSchema.parse(
            await desktopApi.finalizeRecord({ record: input, operatorContext }),
        );
    }

    if (canUseHostedRecordsApi({ capabilities, usesStaticHostedBrowserBuild })) {
        return AppRecordSchema.parse(
            await requestHostedApi('/records/finalize', 'POST', { record: input }),
        );
    }

    return buildStoredRecord(input, operatorContext, existing, 'Finalized');
};

export const cancelRuntimeRecord = async ({
    capabilities,
    existing,
    operatorContext,
    reason,
    recordId,
    usesStaticHostedBrowserBuild,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
    readonly existing: AppRecord | undefined;
    readonly operatorContext: OperatorContext;
    readonly reason: string;
    readonly recordId: string;
    readonly usesStaticHostedBrowserBuild: boolean;
}): Promise<AppRecord> => {
    if (existing?.status !== 'Finalized') {
        throw new Error('Only finalized records can be cancelled.');
    }

    if (operatorContext.role === 'User') {
        throw new Error('Only Admin or SysAdmin can cancel finalized records.');
    }

    const desktopApi = window.vaultBillDesktop;
    if (desktopApi) {
        return AppRecordSchema.parse(
            await desktopApi.cancelRecord({ recordId, reason, operatorContext }),
        );
    }

    if (canUseHostedRecordsApi({ capabilities, usesStaticHostedBrowserBuild })) {
        return AppRecordSchema.parse(
            await requestHostedApi('/records/cancel', 'POST', { recordId, reason }),
        );
    }

    return AppRecordSchema.parse({
        ...existing,
        status: 'Cancelled',
        updatedAt: new Date().toISOString(),
        cancellationReason: reason.trim(),
    });
};

export const fetchBuilderInventory = async ({
    capabilities,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
}): Promise<readonly BuilderInventoryItem[]> => {
    if (window.vaultBillDesktop) {
        return mergeBuiltInBuilderInventory(await window.vaultBillDesktop.listBuilderInventory());
    }
    if (capabilities.isHostedWeb) {
        return mergeBuiltInBuilderInventory(
            await requestHostedApi<readonly BuilderInventoryItem[]>('/builder/inventory'),
        );
    }
    return listBrowserBuilderInventory();
};

export const fetchBuilderPackage = async ({
    capabilities,
    formatId,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
    readonly formatId: string | undefined;
}): Promise<StoredBuilderPackage | null> => {
    const fallbackBuiltInPackage = readBrowserBuilderPackage(formatId);
    if (window.vaultBillDesktop) {
        return (
            (await window.vaultBillDesktop.loadBuilderPackage(formatId)) ?? fallbackBuiltInPackage
        );
    }
    if (capabilities.isHostedWeb) {
        const query = formatId ? `?formatId=${encodeURIComponent(formatId)}` : '';
        return (
            (await requestHostedApi<StoredBuilderPackage | undefined>(
                `/builder/package${query}`,
            )) ?? fallbackBuiltInPackage
        );
    }
    return (fallbackBuiltInPackage ?? {
        config: readConfig(),
        templateHtml: readTemplateHtml(),
        savedTemplates: readSavedTemplates(),
        assets: readBuilderAssets(),
    }) satisfies StoredBuilderPackage;
};

export const removeBuilderPackage = async ({
    capabilities,
    formatId,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
    readonly formatId: string;
}): Promise<void> => {
    if (window.vaultBillDesktop) {
        await window.vaultBillDesktop.deleteBuilderPackage(formatId);
        return;
    }
    if (capabilities.isHostedWeb) {
        await requestHostedApi(
            `/builder/package?formatId=${encodeURIComponent(formatId)}`,
            'DELETE',
        );
        return;
    }
    removeBrowserBuilderPackage(formatId);
};

export const saveBuilderPackage = async ({
    assets,
    capabilities,
    config,
    savedTemplates,
    templateHtml,
}: {
    readonly assets: readonly AssetSummary[];
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
    readonly config: DocumentFormatConfig;
    readonly savedTemplates: readonly SavedPrintTemplate[];
    readonly templateHtml: string;
}): Promise<void> => {
    const builderPackage = { config, templateHtml, assets, savedTemplates };
    if (window.vaultBillDesktop) {
        await window.vaultBillDesktop.saveBuilderPackage(builderPackage);
        return;
    }
    if (capabilities.isHostedWeb) {
        await requestHostedApi('/builder/package', 'POST', builderPackage);
        return;
    }
    writeBuilderPackage(builderPackage);
};

export const fetchReportPage = async ({
    canUseHostedReportsApi,
    cursor,
    query,
}: {
    readonly canUseHostedReportsApi: boolean;
    readonly cursor?: string;
    readonly query: Readonly<Record<string, unknown>>;
}): Promise<ReportPageSnapshot> => {
    const nextQuery = cursor ? { ...query, cursor } : query;
    const rawPage = window.vaultBillDesktop
        ? await window.vaultBillDesktop.queryReport(nextQuery)
        : canUseHostedReportsApi
          ? await requestHostedApi<{
                readonly rows: readonly unknown[];
                readonly total: number;
                readonly nextCursor?: string;
            }>('/reports/query', 'POST', nextQuery)
          : { rows: [], total: 0, nextCursor: undefined };

    return {
        rows: rawPage.rows.map((row) => AppRecordSchema.parse(row)),
        total: rawPage.total,
        ...(rawPage.nextCursor ? { nextCursor: rawPage.nextCursor } : {}),
    };
};

export const runPrintHtmlOutput = async ({
    capabilities,
    html,
    jobId,
    printerName,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
    readonly html: string;
    readonly jobId: string;
    readonly printerName?: string;
}): Promise<void> => {
    if (window.vaultBillDesktop) {
        const result = await window.vaultBillDesktop.printHtml({
            html,
            jobId,
            ...(printerName ? { printerName } : {}),
        });
        if (!result.success) throw new Error(result.warning ?? 'Printing failed.');
        return;
    }
    if (capabilities.isHostedWeb) {
        const result = await requestHostedApi<{ success: boolean; warning?: string }>(
            '/print/html',
            'POST',
            { html, jobId },
        );
        if (!result.success) throw new Error(result.warning ?? 'Host printing failed.');
        return;
    }
    window.print();
};

export const downloadPdfOutput = async ({
    fileName,
    html,
    jobId,
}: {
    readonly fileName: string;
    readonly html: string;
    readonly jobId: string;
}): Promise<void> => {
    if (!window.vaultBillDesktop) throw new Error('PDF download is unavailable.');
    const result = await window.vaultBillDesktop.downloadPdf({
        html,
        fileName,
        jobId,
    });
    if (!result.success || !result.pdfData) {
        throw new Error(result.warning ?? 'PDF generation failed.');
    }
    const arrayBuffer = new Uint8Array(result.pdfData).buffer;
    const url = URL.createObjectURL(new Blob([arrayBuffer], { type: 'application/pdf' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = result.fileName;
    anchor.click();
    URL.revokeObjectURL(url);
};

export const cancelRuntimeOutput = async ({
    capabilities,
    jobId,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
    readonly jobId: string;
}): Promise<boolean> => {
    if (window.vaultBillDesktop) {
        return window.vaultBillDesktop.cancelOutput(jobId);
    }
    if (capabilities.isHostedWeb) {
        return requestHostedApi('/print/cancel', 'POST', { jobId });
    }
    return false;
};

export const fetchSecretsSettings = async ({
    capabilities,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
}): Promise<SecretsSettings> => {
    if (window.vaultBillDesktop) {
        return normalizeSecretsSettings(await window.vaultBillDesktop.getSecretsSettings());
    }
    if (capabilities.isHostedWeb) {
        try {
            return normalizeSecretsSettings(await requestHostedApi('/settings/secrets'));
        } catch (error) {
            if (isHostedApiErrorStatus(error, [401, 403, 404])) {
                return defaultSecretsSettings;
            }
            throw error;
        }
    }
    return defaultSecretsSettings;
};

export const saveSecretsSettings = async ({
    capabilities,
    settings,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
    readonly settings: SecretsSettings;
}): Promise<void> => {
    if (window.vaultBillDesktop) {
        await window.vaultBillDesktop.saveSecretsSettings(settings);
        return;
    }
    if (capabilities.isHostedWeb) {
        await requestHostedApi('/settings/secrets', 'POST', settings);
    }
};

/** Applies a license key through the runtime that owns activation state. */
export const activateRuntimeLicense = async ({
    capabilities,
    licenseKey,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
    readonly licenseKey: string;
}): Promise<void> => {
    if (window.vaultBillDesktop?.activateLicense) {
        await window.vaultBillDesktop.activateLicense(licenseKey);
        return;
    }

    if (capabilities.isHostedWeb) {
        await requestHostedApi('/trial/activate', 'POST', { licenseKey });
        return;
    }

    throw new Error('License activation is unavailable in this runtime.');
};

/** Returns activation state to a fresh unactivated trial in supported runtimes. */
export const resetRuntimeTrial = async ({
    capabilities,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
}): Promise<void> => {
    if (window.vaultBillDesktop?.resetTrial) {
        await window.vaultBillDesktop.resetTrial();
        return;
    }

    if (capabilities.isHostedWeb) {
        await requestHostedApi('/trial/reset', 'POST');
        return;
    }

    throw new Error('Trial reset is unavailable in this runtime.');
};
