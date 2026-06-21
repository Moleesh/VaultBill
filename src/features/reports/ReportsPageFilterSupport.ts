/** @format */

import type { useRecordStore } from '../records/RecordStoreContext';
import type { ReportFieldFilter } from './ReportsPageTypes';

export const defaultReportField = '';

export const createReportFilter = (
    field: string = defaultReportField,
    value = '',
): ReportFieldFilter => ({
    id: globalThis.crypto.randomUUID(),
    field,
    value,
});

const normalizeValue = (value: unknown): string =>
    typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
        ? String(value)
        : '';

const reportFieldValueFor = (
    record: ReturnType<typeof useRecordStore>['records'][number],
    field: string,
) => {
    if (field === 'documentNumber') return record.documentNumber ?? '';
    if (field === 'customerName') return record.customerName;
    if (field === 'gstin') return record.gstin;
    if (field === 'invoiceDate') return record.invoiceDate;
    if (field === 'status') return record.status;
    if (field === 'grandTotal') return record.grandTotal;
    return '';
};

/** Returns whether a record matches the selected report-field filter. */
export const matchesReportField = (
    record: ReturnType<typeof useRecordStore>['records'][number],
    filter: ReportFieldFilter,
): boolean => {
    const normalizedValue = filter.value.trim().toLocaleLowerCase();
    if (
        !filter.field ||
        !normalizedValue ||
        (filter.field === 'status' && normalizedValue === 'all')
    )
        return true;
    const recordValue = reportFieldValueFor(record, filter.field);
    return normalizeValue(recordValue).toLocaleLowerCase().includes(normalizedValue);
};
