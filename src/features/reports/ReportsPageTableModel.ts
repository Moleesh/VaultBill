/** @format */

import type { AppRecord } from '../records/RecordStoreSupport';
import {
    defaultDisplayFieldsForReport,
    formatReportDisplayFieldLabel,
    reportDisplayFieldOptionsFor,
} from './ReportsPageColumns';

export type ReportTableColumn = {
    readonly align?: 'left' | 'right';
    readonly key: string;
    readonly label: string;
};

export type ReportTableModel = {
    readonly columns: readonly ReportTableColumn[];
    readonly rows: readonly (readonly string[])[];
};

/** Filters saved display fields down to the options supported by the current report format. */
const normalizeDisplayFields = (
    reportId: string,
    displayFields: readonly string[],
): readonly string[] => {
    if (reportId === 'sales-register' && displayFields.length > 0) return displayFields;
    const allowedFields = new Set(
        reportDisplayFieldOptionsFor(reportId).map((option) => option.value),
    );
    const filtered = displayFields.filter((field) => allowedFields.has(field));
    return filtered.length > 0 ? filtered : defaultDisplayFieldsForReport(reportId);
};

/** Formats report currency-like values consistently across table, print, and CSV views. */
const formatMoney = (value: number | string): string => {
    const numeric = typeof value === 'number' ? value : Number.parseFloat(value);
    return `₹${Number.isFinite(numeric) ? numeric.toFixed(2) : '0.00'}`;
};

/** Aggregates finalized records into tax buckets used by the tax-summary output. */
export const buildTaxSummary = (
    records: readonly AppRecord[],
): readonly { rate: string; taxable: number; tax: number; count: number }[] => {
    const summary = new Map<
        string,
        { rate: string; taxable: number; tax: number; count: number }
    >();
    for (const record of records.filter((item) => item.status === 'Finalized')) {
        for (const line of record.lineItems) {
            const rateNumber = Number.parseFloat(line.taxPercent) || 0;
            const gross = Number.parseFloat(line.amount) || 0;
            const taxable = rateNumber === 0 ? gross : gross / (1 + rateNumber / 100);
            const current = summary.get(line.taxPercent) ?? {
                rate: line.taxPercent,
                taxable: 0,
                tax: 0,
                count: 0,
            };
            current.taxable += taxable;
            current.tax += gross - taxable;
            current.count += 1;
            summary.set(line.taxPercent, current);
        }
    }
    return [...summary.values()].sort(
        (left, right) => Number.parseFloat(left.rate) - Number.parseFloat(right.rate),
    );
};

/** Aggregates filtered records into customer-ledger rows used by the ledger output. */
export const buildCustomerLedger = (
    records: readonly AppRecord[],
): readonly {
    customer: string;
    gstin: string;
    latestDate: string;
    documents: number;
    cancelled: number;
    revenue: number;
}[] => {
    const ledger = new Map<
        string,
        {
            customer: string;
            gstin: string;
            latestDate: string;
            documents: number;
            cancelled: number;
            revenue: number;
        }
    >();
    for (const record of records) {
        const key = `${record.customerName.toLocaleLowerCase()}:${record.gstin.toLocaleLowerCase()}`;
        const current = ledger.get(key) ?? {
            customer: record.customerName,
            gstin: record.gstin,
            latestDate: record.invoiceDate,
            documents: 0,
            cancelled: 0,
            revenue: 0,
        };
        current.documents += 1;
        current.latestDate =
            current.latestDate > record.invoiceDate ? current.latestDate : record.invoiceDate;
        if (record.status === 'Cancelled') current.cancelled += 1;
        if (record.status === 'Finalized')
            current.revenue += Number.parseFloat(record.grandTotal) || 0;
        ledger.set(key, current);
    }
    return [...ledger.values()].sort(
        (left, right) =>
            right.revenue - left.revenue || left.customer.localeCompare(right.customer),
    );
};

const buildSalesRegisterTableModel = (
    records: readonly AppRecord[],
    displayFields: readonly string[],
): ReportTableModel => {
    const fields = normalizeDisplayFields('sales-register', displayFields);
    return {
        columns: fields.map((field) => ({
            key: field,
            label: formatReportDisplayFieldLabel('sales-register', field),
            ...(field === 'grandTotal' ? { align: 'right' as const } : {}),
        })),
        rows: records.map((record) =>
            fields.map((field) => {
                if (field === 'documentNumber') return record.documentNumber ?? 'Draft record';
                if (field === 'customerName') return record.customerName;
                if (field === 'gstin') return record.gstin;
                if (field === 'invoiceDate') return record.invoiceDate;
                if (field === 'grandTotal') return formatMoney(record.grandTotal);
                if (field === 'status') return record.status;
                if (field === 'updatedAt') return record.updatedAt;
                return record.fieldValues?.[field] ?? '';
            }),
        ),
    };
};

const buildTaxSummaryTableModel = (
    records: readonly AppRecord[],
    displayFields: readonly string[],
): ReportTableModel => {
    const fields = normalizeDisplayFields('tax-summary', displayFields);
    return {
        columns: fields.map((field) => ({
            key: field,
            label: formatReportDisplayFieldLabel('tax-summary', field),
            ...(field === 'taxRate' ? {} : { align: 'right' as const }),
        })),
        rows: buildTaxSummary(records).map((row) =>
            fields.map((field) => {
                if (field === 'taxRate') return `${row.rate}%`;
                if (field === 'taxableValue') return formatMoney(row.taxable);
                if (field === 'taxAmount') return formatMoney(row.tax);
                if (field === 'lineCount') return String(row.count);
                return '';
            }),
        ),
    };
};

const buildCustomerLedgerTableModel = (
    records: readonly AppRecord[],
    displayFields: readonly string[],
): ReportTableModel => {
    const fields = normalizeDisplayFields('customer-ledger', displayFields);
    const leftAlignedFields = new Set(['customerName', 'gstin', 'latestDate']);
    return {
        columns: fields.map((field) => ({
            key: field,
            label: formatReportDisplayFieldLabel('customer-ledger', field),
            ...(leftAlignedFields.has(field) ? {} : { align: 'right' as const }),
        })),
        rows: buildCustomerLedger(records).map((row) =>
            fields.map((field) => {
                if (field === 'customerName') return row.customer;
                if (field === 'gstin') return row.gstin;
                if (field === 'latestDate') return row.latestDate;
                if (field === 'documentCount') return String(row.documents);
                if (field === 'cancelledCount') return String(row.cancelled);
                if (field === 'finalizedRevenue') return formatMoney(row.revenue);
                return '';
            }),
        ),
    };
};

/** Builds one normalized table model so results, CSV, and print stay in sync. */
export const buildReportTableModel = (
    reportId: string,
    records: readonly AppRecord[],
    displayFields: readonly string[],
): ReportTableModel => {
    if (reportId === 'tax-summary') return buildTaxSummaryTableModel(records, displayFields);
    if (reportId === 'customer-ledger')
        return buildCustomerLedgerTableModel(records, displayFields);
    return buildSalesRegisterTableModel(records, displayFields);
};
