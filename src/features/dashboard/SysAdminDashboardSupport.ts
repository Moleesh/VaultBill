/** @format */

import { useEffect, useState } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import { requestHostedApi } from '../../runtime/HostedApi';

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

export type TrialCountdownParts = {
    readonly amount: string;
    readonly label: string;
};

const defaultSummary: SysAdminSummary = {
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

const buildSummary = (
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

const loadDesktopSummary = async (): Promise<SysAdminDashboardState> => {
    const [inventory, records, accounts, backupStatus, trialStatus] = await Promise.all([
        window.vaultBillDesktop?.listBuilderInventory() ??
            Promise.resolve([] as readonly InventoryItem[]),
        window.vaultBillDesktop?.listRecords() ?? Promise.resolve([]),
        window.vaultBillDesktop?.listAccounts() ??
            Promise.resolve([] as readonly HostedAccountSummary[]),
        window.vaultBillDesktop?.getBackupStatus() ?? Promise.resolve({ lastBackupAt: null }),
        window.vaultBillDesktop?.getTrialStatus() ??
            Promise.resolve({
                remainingSeconds: 0,
                isExpired: false,
                isFullVersion: false,
            }),
    ]);
    return {
        inventory,
        summary: buildSummary(
            inventory,
            records as readonly HostedRecordSummary[],
            accounts,
            backupStatus,
            trialStatus,
        ),
        message: '',
    };
};

const loadHostedSummary = async (): Promise<SysAdminDashboardState> => {
    const [inventory, records, accounts, backupStatus, trialStatus] = await Promise.all([
        requestHostedApi<readonly InventoryItem[]>('/builder/inventory'),
        requestHostedApi<readonly HostedRecordSummary[]>('/records'),
        requestHostedApi<readonly HostedAccountSummary[]>('/auth/accounts'),
        requestHostedApi<{ readonly lastBackupAt: string | null }>('/backup/status'),
        requestHostedApi<{
            readonly isFullVersion: boolean;
            readonly isExpired: boolean;
            readonly remainingSeconds: number;
        }>('/trial/status'),
    ]);
    return {
        inventory,
        summary: buildSummary(inventory, records, accounts, backupStatus, {
            remainingSeconds: trialStatus.remainingSeconds,
            isExpired: trialStatus.isExpired,
            isFullVersion: trialStatus.isFullVersion,
        }),
        message: '',
    };
};

/**
 * Loads the SysAdmin dashboard summary from the desktop bridge or hosted API.
 */
export const useSysAdminDashboardState = (): SysAdminDashboardState => {
    const capabilities = useCapabilities();
    const [state, setState] = useState<SysAdminDashboardState>({
        inventory: [],
        summary: defaultSummary,
        message: '',
    });

    useEffect(() => {
        const load = async () => {
            try {
                const nextState = window.vaultBillDesktop
                    ? await loadDesktopSummary()
                    : capabilities.isLanBrowser
                      ? await loadHostedSummary()
                      : { inventory: [], summary: defaultSummary, message: '' };
                setState(nextState);
            } catch (reason: unknown) {
                setState({
                    inventory: [],
                    summary: defaultSummary,
                    message:
                        reason instanceof Error
                            ? reason.message
                            : 'Dashboard summary could not load.',
                });
            }
        };
        void load();
    }, [capabilities.isLanBrowser]);

    return state;
};
