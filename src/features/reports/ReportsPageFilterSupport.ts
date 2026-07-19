/** @format */

import type { useRecordStore } from '../records/RecordStoreContext';
import type { ReportFieldFilter } from './ReportsPageTypes';

export const defaultReportField = '';
export const defaultReportSorts = ['updatedAt:desc'] as const;

export const createReportFilter = (
    field: string = defaultReportField,
    value = '',
): ReportFieldFilter => ({
    id: globalThis.crypto.randomUUID(),
    field,
    operator: 'contains',
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
    if (field === 'updatedAt') return record.updatedAt;
    return record.fieldValues?.[field] ?? '';
};

/** Applies the saved sort order to report records before rendering or export. */
export const compareReportRecordsBySorts = (
    left: ReturnType<typeof useRecordStore>['records'][number],
    right: ReturnType<typeof useRecordStore>['records'][number],
    sorts: readonly string[],
): number => {
    for (const sort of sorts) {
        const [field = 'updatedAt', direction = 'desc'] = sort.split(':');
        const leftValue = normalizeValue(reportFieldValueFor(left, field));
        const rightValue = normalizeValue(reportFieldValueFor(right, field));
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

/** Returns whether a record matches the selected report-field filter. */
export const matchesReportField = (
    record: ReturnType<typeof useRecordStore>['records'][number],
    filter: ReportFieldFilter,
): boolean => {
    const operator = filter.operator ?? 'contains';
    const rawValue = filter.value.trim();
    const rawEndValue = filter.valueEnd?.trim() ?? '';
    if (
        !filter.field ||
        (!rawValue && !['is-empty', 'is-not-empty'].includes(operator)) ||
        (filter.field === 'status' && rawValue.toLocaleLowerCase() === 'all')
    )
        return true;
    const recordValue = reportFieldValueFor(record, filter.field);
    const sourceValue = normalizeValue(recordValue);
    const compareSource =
        filter.caseInsensitive === false ? sourceValue : sourceValue.toLocaleLowerCase();
    const compareValue = filter.caseInsensitive === false ? rawValue : rawValue.toLocaleLowerCase();
    const numericSource = Number(sourceValue);
    const numericValue = Number(rawValue);
    const numericEndValue = Number(rawEndValue);

    if (operator === 'is-empty') return sourceValue.trim() === '';
    if (operator === 'is-not-empty') return sourceValue.trim() !== '';
    if (operator === 'does-not-contain') return !compareSource.includes(compareValue);
    if (operator === 'equals' || operator === 'is' || operator === 'on')
        return compareSource === compareValue;
    if (operator === 'does-not-equal' || operator === 'is-not')
        return compareSource !== compareValue;
    if (operator === 'starts-with') return compareSource.startsWith(compareValue);
    if (operator === 'ends-with') return compareSource.endsWith(compareValue);
    if (operator === 'before') return sourceValue < rawValue;
    if (operator === 'on-or-before') return sourceValue <= rawValue;
    if (operator === 'after') return sourceValue > rawValue;
    if (operator === 'on-or-after') return sourceValue >= rawValue;
    if (operator === 'greater-than') return numericSource > numericValue;
    if (operator === 'greater-than-or-equal') return numericSource >= numericValue;
    if (operator === 'less-than') return numericSource < numericValue;
    if (operator === 'less-than-or-equal') return numericSource <= numericValue;
    if (operator === 'between') {
        if (Number.isFinite(numericSource) && Number.isFinite(numericValue)) {
            return numericSource >= numericValue && numericSource <= numericEndValue;
        }
        return sourceValue >= rawValue && (!rawEndValue || sourceValue <= rawEndValue);
    }
    if (operator === 'one-of') {
        return rawValue
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
            .some((value) =>
                filter.caseInsensitive === false
                    ? value === sourceValue
                    : value.toLocaleLowerCase() === compareSource,
            );
    }
    return compareSource.includes(compareValue);
};
