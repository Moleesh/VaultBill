/** @format */

import { loadRecordPrintPackage, type RecordPrintPackage } from '../records/RecordPrintHtml';
import { AppRecordSchema, type AppRecord } from '../records/RecordStoreSupport';
import { requestHostedApi } from '../../runtime/HostedApi';
export {
    buildCustomerLedger,
    buildReportCsv,
    buildTaxSummary,
    renderReportHtml,
} from './ReportsPageRenderingSupport';

export const pageSize = 50;
export const printBatchSize = 10;
export const reportOptions = [
    { value: 'sales-register', label: 'Sales register' },
    { value: 'tax-summary', label: 'Tax summary' },
    { value: 'customer-ledger', label: 'Customer ledger' },
] as const;

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
    isLanBrowser: boolean,
): Promise<ReadonlyMap<string, RecordPrintPackage>> => {
    const formatIds = [...new Set(records.map((record) => record.formatId))];
    const loaded = await Promise.all(
        formatIds.map(async (formatId) => ({
            formatId,
            package: await loadRecordPrintPackage(formatId, isLanBrowser).catch(() => undefined),
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
    const rawPage = window.vaultBillDesktop
        ? await window.vaultBillDesktop.queryReport(query)
        : await requestHostedApi<ReportPagePayload>('/reports/query', 'POST', query);
    return {
        rows: rawPage.rows.map((row) => AppRecordSchema.parse(row)),
        total: rawPage.total,
        ...(rawPage.nextCursor ? { nextCursor: rawPage.nextCursor } : {}),
    };
};
