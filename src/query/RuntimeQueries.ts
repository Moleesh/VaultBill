/** @format */
/* eslint-disable max-lines */

import type { CapabilityRegistry } from '../capability/Capability.types';
import {
    canUseLocalHostedApi,
    isHostedApiErrorStatus,
    requestHostedApi,
} from '../runtime/HostedApi';
import { canUseDbBackedRuntime } from '../runtime/RuntimeMode';
import {
    defaultWorkspaceSettings,
    normalizeWorkspaceSettings,
    type WorkspaceSettings,
} from '../runtime/WorkspaceSettings';
import type { OperatorAccount } from '../features/auth/AccountTypes';
import type { OperatorContext } from '../features/auth/AccountTypes';
import { bootstrapOperatorAccounts } from '../features/auth/AccountBootstrap';
import { demoAccount } from '../features/auth/SessionSupport';
import {
    defaultSecretsSettings,
    normalizeSecretsSettings,
    type SecretsSettings,
} from '../features/settings/SettingsSecretsSectionSupport';
import type { BuilderInventoryItem } from '../features/builder/BuilderDocumentLibrarySupport';
import type {
    AssetSummary,
    SavedPrintTemplate,
    StoredBuilderPackage,
} from '../features/builder/BuilderPageSupport';
import type { PublishedFormat } from '../features/records/useRecordsPageStateSupport';
import type {
    CredentialStatus,
    TrialStatus,
} from '../features/settings/SettingsSecuritySectionStateSupport';
import {
    AppRecordSchema,
    buildStoredRecord,
    readBrowserRecords,
    sortLatestFirst,
    type AppRecord,
    type EditableRecord,
} from '../features/records/RecordStoreSupport';
import {
    readBuilderAssets,
    readConfig,
    readSavedTemplates,
    readTemplateHtml,
    writeBuilderPackage,
} from '../features/builder/BuilderPageSupport';
import type { DocumentFormatConfig } from '../features/builder/BuilderPageControllerSupport';

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

type QueryCapabilities = Pick<CapabilityRegistry, 'isDemoMode' | 'isDesktop' | 'isHostedWeb'>;

const readHostedSessionSnapshot = async (): Promise<SessionSnapshot> => {
    await requestHostedApi('/health');
    const [accounts, session] = await Promise.all([
        requestHostedApi<readonly OperatorAccount[]>('/auth/accounts'),
        requestHostedApi<
            | {
                  readonly account: OperatorAccount;
                  readonly csrfToken: string;
              }
            | undefined
        >('/auth/session'),
    ]);

    return {
        accounts,
        account: session?.account,
        csrfToken: session?.csrfToken,
    };
};

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
    if (!canUseHostedSetupStatus) return readDesktopSetupStatus();

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
            requestHostedApi<readonly OperatorAccount[]>('/auth/accounts').catch(
                () => fallbackAccounts,
            ),
        ]);
        return {
            business: normalizeWorkspaceSettings(business),
            accounts,
        };
    }

    return {
        business: fallbackBusiness,
        accounts: fallbackAccounts,
    };
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
        if (desktopAccounts.some((account) => account.isActive)) {
            return {
                accounts: desktopAccounts,
                account: undefined,
                csrfToken: undefined,
            };
        }

        try {
            const hostedAccounts =
                await requestHostedApi<readonly OperatorAccount[]>('/auth/accounts');
            return {
                accounts: hostedAccounts,
                account: undefined,
                csrfToken: undefined,
            };
        } catch {
            return {
                accounts: desktopAccounts,
                account: undefined,
                csrfToken: undefined,
            };
        }
    }

    if (canUseHostedSessionApi) {
        return readHostedSessionSnapshot();
    }

    return {
        accounts: bootstrapOperatorAccounts,
        account: undefined,
        csrfToken: undefined,
    };
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

export const fetchPublishedFormats = async ({
    capabilities,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
}): Promise<readonly PublishedFormat[]> => {
    if (window.vaultBillDesktop) {
        return window.vaultBillDesktop.listBuilderInventory();
    }
    if (capabilities.isHostedWeb) {
        return requestHostedApi<readonly PublishedFormat[]>('/print/formats');
    }
    return [];
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
        const storedRecords = await requestHostedApi('/records').catch(() =>
            desktopApi.listRecords(),
        );
        return sortLatestFirst(AppRecordSchema.array().parse(storedRecords));
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
            await requestHostedApi('/records/draft', 'POST', { record: input }).catch(() =>
                desktopApi.saveDraft({ record: input, operatorContext }),
            ),
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
            await requestHostedApi('/records/finalize', 'POST', { record: input }).catch(() =>
                desktopApi.finalizeRecord({ record: input, operatorContext }),
            ),
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
            await requestHostedApi('/records/cancel', 'POST', { recordId, reason }).catch(() =>
                desktopApi.cancelRecord({ recordId, reason, operatorContext }),
            ),
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
        return window.vaultBillDesktop.listBuilderInventory();
    }
    if (capabilities.isHostedWeb) {
        return requestHostedApi<readonly BuilderInventoryItem[]>('/builder/inventory');
    }
    return [];
};

export const fetchBuilderPackage = async ({
    capabilities,
    formatId,
}: {
    readonly capabilities: Pick<CapabilityRegistry, 'isHostedWeb'>;
    readonly formatId: string | undefined;
}): Promise<StoredBuilderPackage | undefined> => {
    if (window.vaultBillDesktop) {
        return window.vaultBillDesktop.loadBuilderPackage(formatId);
    }
    if (capabilities.isHostedWeb) {
        const query = formatId ? `?formatId=${encodeURIComponent(formatId)}` : '';
        return requestHostedApi<StoredBuilderPackage | undefined>(`/builder/package${query}`);
    }

    return {
        config: readConfig(),
        templateHtml: readTemplateHtml(),
        savedTemplates: readSavedTemplates(),
        assets: readBuilderAssets(),
    } satisfies StoredBuilderPackage;
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
    throw new Error('Document deletion is only available through VaultBill Desktop.');
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
