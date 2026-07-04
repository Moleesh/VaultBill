/** @format */

import type { StoredRecord } from './RecordStoreSchemas.js';

/** Reads one saved-report sort field from a stored record using the report table vocabulary. */
const reportFieldValueFor = (record: StoredRecord, field: string): string => {
    if (field === 'documentNumber') return record.documentNumber ?? '';
    if (field === 'customerName') return record.customerName;
    if (field === 'gstin') return record.gstin;
    if (field === 'invoiceDate') return record.invoiceDate;
    if (field === 'status') return record.status;
    if (field === 'grandTotal') return record.grandTotal;
    if (field === 'updatedAt') return record.updatedAt;
    return '';
};

/** Applies saved report sort rules to desktop report query rows. */
export const compareStoredReportRecordsBySorts = (
    left: StoredRecord,
    right: StoredRecord,
    sorts: readonly string[],
): number => {
    for (const sort of sorts) {
        const [field = 'updatedAt', direction = 'desc'] = sort.split(':');
        const leftValue = reportFieldValueFor(left, field);
        const rightValue = reportFieldValueFor(right, field);
        const multiplier = direction === 'asc' ? 1 : -1;
        const leftNumber = Number(leftValue);
        const rightNumber = Number(rightValue);
        const comparison =
            Number.isFinite(leftNumber) && Number.isFinite(rightNumber)
                ? leftNumber - rightNumber
                : leftValue.localeCompare(rightValue);
        if (comparison !== 0) return comparison * multiplier;
    }

    return (
        right.updatedAt.localeCompare(left.updatedAt) || left.recordId.localeCompare(right.recordId)
    );
};
