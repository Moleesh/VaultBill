/** @format */

import { defaultDisplayFieldsForReport, reportDisplayFieldOptionsFor } from './ReportsPageColumns';
import { reportOptions } from './ReportsPageSupport';
import type { ReportFieldFilter } from './ReportsPageTypes';

export type SavedReportDefinition = {
    readonly reportId: string;
    readonly ownerUserId: string;
    readonly name: string;
    readonly formatId: string;
    readonly displayFields: readonly string[];
    readonly sorts: readonly string[];
    readonly filters: readonly ReportFieldFilter[];
    readonly preset: string;
    readonly status: string;
    readonly isBuiltIn: boolean;
    readonly createdAt: string;
    readonly updatedAt: string;
};

export type SavedReportDraft = Omit<
    SavedReportDefinition,
    'createdAt' | 'isBuiltIn' | 'reportId' | 'updatedAt'
> & {
    readonly reportId?: string;
};

export type SavedReportEditorInput = {
    readonly displayFields: readonly string[];
    readonly filters: readonly ReportFieldFilter[];
    readonly formatId: string;
    readonly name: string;
    readonly preset: string;
    readonly reportId?: string;
    readonly sorts: readonly string[];
    readonly status: string;
};

export type ReportFieldKind = 'date' | 'enum' | 'number' | 'string';

export const customReportLimitPerUser = 5;
export const defaultDisplayFields = defaultDisplayFieldsForReport('sales-register');

export const defaultSorts = ['updatedAt:desc'] as const;

const builtInFormats = ['sales-register', 'tax-summary', 'customer-ledger'] as const;

const fieldKinds: Readonly<Record<string, ReportFieldKind>> = {
    customerName: 'string',
    documentNumber: 'string',
    gstin: 'string',
    grandTotal: 'number',
    invoiceDate: 'date',
    status: 'enum',
    updatedAt: 'date',
};

export const reportOperatorOptionsByKind: Readonly<
    Record<ReportFieldKind, readonly { readonly value: string; readonly label: string }[]>
> = {
    string: [
        { value: 'contains', label: 'contains' },
        { value: 'does-not-contain', label: 'does not contain' },
        { value: 'equals', label: 'equals' },
        { value: 'does-not-equal', label: 'does not equal' },
        { value: 'starts-with', label: 'starts with' },
        { value: 'ends-with', label: 'ends with' },
        { value: 'is-empty', label: 'is empty' },
        { value: 'is-not-empty', label: 'is not empty' },
    ],
    number: [
        { value: 'equals', label: 'equals' },
        { value: 'does-not-equal', label: 'does not equal' },
        { value: 'greater-than', label: 'greater than' },
        { value: 'greater-than-or-equal', label: 'greater than or equal' },
        { value: 'less-than', label: 'less than' },
        { value: 'less-than-or-equal', label: 'less than or equal' },
        { value: 'between', label: 'between' },
        { value: 'is-empty', label: 'is empty' },
        { value: 'is-not-empty', label: 'is not empty' },
    ],
    date: [
        { value: 'on', label: 'on' },
        { value: 'before', label: 'before' },
        { value: 'on-or-before', label: 'on or before' },
        { value: 'after', label: 'after' },
        { value: 'on-or-after', label: 'on or after' },
        { value: 'between', label: 'between' },
        { value: 'is-empty', label: 'is empty' },
        { value: 'is-not-empty', label: 'is not empty' },
    ],
    enum: [
        { value: 'is', label: 'is' },
        { value: 'is-not', label: 'is not' },
        { value: 'one-of', label: 'one of' },
    ],
};

/** Built-in report definitions seeded for every output format. */
export const builtInSavedReports: readonly SavedReportDefinition[] = builtInFormats.flatMap(
    (formatId) => [
        {
            reportId: `builtin-${formatId}-today`,
            ownerUserId: 'system',
            name: "Today's report",
            formatId,
            displayFields: defaultDisplayFieldsForReport(formatId),
            sorts: ['updatedAt:desc'],
            filters: [],
            preset: 'Today',
            status: 'All',
            isBuiltIn: true,
            createdAt: 'system',
            updatedAt: 'system',
        },
        {
            reportId: `builtin-${formatId}-this-month`,
            ownerUserId: 'system',
            name: 'This month report',
            formatId,
            displayFields: defaultDisplayFieldsForReport(formatId),
            sorts: ['invoiceDate:desc'],
            filters: [],
            preset: 'ThisMonth',
            status: 'All',
            isBuiltIn: true,
            createdAt: 'system',
            updatedAt: 'system',
        },
    ],
);

/** Resolves the filter kind for a report field so controls can expose valid operators. */
export const fieldKindForReportField = (field: string): ReportFieldKind =>
    fieldKinds[field] ?? 'string';

/** Returns the operator list that matches a report field's data type. */
export const operatorOptionsForReportField = (
    field: string,
): readonly { readonly value: string; readonly label: string }[] =>
    reportOperatorOptionsByKind[fieldKindForReportField(field)];

const defaultOperatorForField = (field: string): string =>
    operatorOptionsForReportField(field)[0]?.value ?? 'contains';

/** Normalizes saved filters before persistence or execution. */
export const normalizeReportFilters = (
    filters: readonly ReportFieldFilter[],
): readonly ReportFieldFilter[] =>
    filters.slice(0, 5).map((filter) => {
        const normalized: ReportFieldFilter = {
            id: filter.id,
            field: filter.field,
            operator: filter.operator ?? defaultOperatorForField(filter.field),
            value: filter.value,
            ...(filter.valueEnd !== undefined ? { valueEnd: filter.valueEnd } : {}),
            ...(filter.promptAtRun !== undefined ? { promptAtRun: filter.promptAtRun } : {}),
            ...(fieldKindForReportField(filter.field) === 'string'
                ? { caseInsensitive: filter.caseInsensitive !== false }
                : {}),
        };
        return normalized;
    });

/** Summarizes a saved report for compact dropdown labels. */
export const reportSummaryLabel = (report: SavedReportDefinition): string => {
    const formatLabel =
        reportOptions.find((option) => option.value === report.formatId)?.label ?? report.formatId;
    const fieldCount =
        report.displayFields.length || reportDisplayFieldOptionsFor(report.formatId).length;
    const filterCount = report.filters.length;
    return `${formatLabel} - ${String(fieldCount)} fields - ${String(filterCount)} filters`;
};
