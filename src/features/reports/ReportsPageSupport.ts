/** @format */

import { loadRecordPrintPackage, type RecordPrintPackage } from '../records/RecordPrintHtml';
import type { AppRecord } from '../records/RecordStoreSupport';
import { canUseLocalHostedApi } from '../../runtime/HostedApi';
import { fetchReportPage } from '../../query/RuntimeQueries';
export {
    buildCustomerLedger,
    buildReportCsv,
    buildTaxSummary,
    renderReportHtml,
} from './ReportsPageRenderingSupport';

export const pageSize = 50;
export const printBatchSize = 10;
export const reportFieldOptions = [
    { value: 'customerName', label: 'Customer name' },
    { value: 'documentNumber', label: 'Record number' },
    { value: 'gstin', label: 'GSTIN' },
    { value: 'invoiceDate', label: 'Invoice date' },
    { value: 'grandTotal', label: 'Grand total' },
    { value: 'status', label: 'Status' },
] as const;
export const reportOptions = [
    { value: 'sales-register', label: 'Sales register' },
    { value: 'tax-summary', label: 'Tax summary' },
    { value: 'customer-ledger', label: 'Customer ledger' },
] as const;

export const formatReportFieldLabel = (field: string): string =>
    reportFieldOptions.find((option) => option.value === field)?.label ?? field;

export type PrintTask = {
    readonly kind: 'report' | 'records';
    readonly completed: number;
    readonly total: number;
    readonly awaitingContinue?: boolean;
    readonly jobId?: string;
    readonly running?: boolean;
    readonly message?: string;
};

export type ReportPage = {
    readonly rows: readonly AppRecord[];
    readonly total: number;
    readonly nextCursor?: string;
};

export type ReportPagePayload = {
    readonly rows: readonly unknown[];
    readonly total: number;
    readonly nextCursor?: string;
};

/**
 * Loads the print template packages used by the current record set.
 */
export const loadPrintPackages = async (
    records: readonly AppRecord[],
    isHostedWeb: boolean,
): Promise<ReadonlyMap<string, RecordPrintPackage>> => {
    const formatIds = [...new Set(records.map((record) => record.formatId))];
    const loaded = await Promise.all(
        formatIds.map(async (formatId) => ({
            formatId,
            package: await loadRecordPrintPackage(formatId, isHostedWeb).catch(() => undefined),
        })),
    );
    return new Map(
        loaded.flatMap((item) => (item.package ? [[item.formatId, item.package] as const] : [])),
    );
};

/**
 * Requests a cursor-based report page from the desktop host or hosted web API.
 */
export const requestReportPage = async (
    query: Readonly<Record<string, unknown>>,
): Promise<ReportPage> => {
    return fetchReportPage({
        canUseHostedReportsApi: window.vaultBillDesktop === undefined && canUseLocalHostedApi(),
        query,
    });
};
