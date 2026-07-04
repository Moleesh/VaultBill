/** @format */

/** Enumerates the allowed visible output columns for each saved-report format. */
export const reportDisplayFieldOptionsByReportId = {
    'sales-register': [
        { value: 'customerName', label: 'Customer name' },
        { value: 'documentNumber', label: 'Record number' },
        { value: 'gstin', label: 'GSTIN' },
        { value: 'invoiceDate', label: 'Invoice date' },
        { value: 'grandTotal', label: 'Grand total' },
        { value: 'status', label: 'Status' },
        { value: 'updatedAt', label: 'Last updated' },
    ],
    'tax-summary': [
        { value: 'taxRate', label: 'Tax rate' },
        { value: 'taxableValue', label: 'Taxable value' },
        { value: 'taxAmount', label: 'Tax amount' },
        { value: 'lineCount', label: 'Finalized lines' },
    ],
    'customer-ledger': [
        { value: 'customerName', label: 'Customer name' },
        { value: 'gstin', label: 'GSTIN' },
        { value: 'latestDate', label: 'Latest record date' },
        { value: 'documentCount', label: 'Record count' },
        { value: 'cancelledCount', label: 'Cancelled' },
        { value: 'finalizedRevenue', label: 'Finalized revenue' },
    ],
} as const;

const displayFieldOptionsByReportId: Readonly<
    Record<string, readonly { readonly value: string; readonly label: string }[]>
> = reportDisplayFieldOptionsByReportId;

/** Defines the default visible columns for each saved-report format. */
export const defaultDisplayFieldsByReportId = {
    'sales-register': ['documentNumber', 'customerName', 'invoiceDate', 'grandTotal', 'status'],
    'tax-summary': ['taxRate', 'taxableValue', 'taxAmount', 'lineCount'],
    'customer-ledger': [
        'customerName',
        'gstin',
        'latestDate',
        'documentCount',
        'cancelledCount',
        'finalizedRevenue',
    ],
} as const;

const defaultDisplayFieldsLookup: Readonly<Record<string, readonly string[]>> =
    defaultDisplayFieldsByReportId;

/** Returns the allowed display-column options for one report output family. */
export const reportDisplayFieldOptionsFor = (
    reportId: string,
): readonly { readonly value: string; readonly label: string }[] =>
    displayFieldOptionsByReportId[reportId] ??
    displayFieldOptionsByReportId['sales-register'] ??
    [];

/** Returns the default visible columns for one report output family. */
export const defaultDisplayFieldsForReport = (reportId: string): readonly string[] =>
    defaultDisplayFieldsLookup[reportId] ?? defaultDisplayFieldsLookup['sales-register'] ?? [];

/** Resolves the human-readable label for one saved-report display field. */
export const formatReportDisplayFieldLabel = (reportId: string, field: string): string =>
    reportDisplayFieldOptionsFor(reportId).find((option) => option.value === field)?.label ?? field;
