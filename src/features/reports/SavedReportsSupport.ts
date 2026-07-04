/** @format */

import type { ReportFieldFilter } from './ReportsPageTypes';
import {
    builtInSavedReports,
    customReportLimitPerUser,
    defaultDisplayFields,
    defaultSorts,
    normalizeReportFilters,
} from './SavedReportsMetadata';
import type { SavedReportDefinition, SavedReportDraft } from './SavedReportsMetadata';

export {
    builtInSavedReports,
    defaultDisplayFields,
    defaultSorts,
    fieldKindForReportField,
    normalizeReportFilters,
    operatorOptionsForReportField,
    reportSummaryLabel,
} from './SavedReportsMetadata';
export type {
    ReportFieldKind,
    SavedReportDefinition,
    SavedReportDraft,
    SavedReportEditorInput,
} from './SavedReportsMetadata';

const savedReportsStorageKey = 'vaultbill.saved-reports';
const defaultReportsStorageKey = 'vaultbill.saved-reports.default-by-user';

const nowIso = () => new Date().toISOString();

const readCustomSavedReports = (): readonly SavedReportDefinition[] => {
    try {
        const reports = JSON.parse(
            window.localStorage.getItem(savedReportsStorageKey) ?? '[]',
        ) as readonly SavedReportDefinition[];
        return reports.filter((report) => !report.isBuiltIn && report.reportId && report.name);
    } catch {
        return [];
    }
};

const writeCustomSavedReports = (reports: readonly SavedReportDefinition[]): void => {
    window.localStorage.setItem(savedReportsStorageKey, JSON.stringify(reports));
};

/** Returns built-in and custom report definitions visible to all operators. */
export const readSavedReports = (): readonly SavedReportDefinition[] => [
    ...builtInSavedReports,
    ...readCustomSavedReports(),
];

/** Builds the default custom-report draft from the currently selected report state. */
export const createSavedReportDraft = ({
    displayFields = defaultDisplayFields,
    filters,
    formatId,
    name,
    ownerUserId,
    preset,
    reportId,
    sorts = defaultSorts,
    status,
}: {
    readonly displayFields?: readonly string[];
    readonly filters: readonly ReportFieldFilter[];
    readonly formatId: string;
    readonly name: string;
    readonly ownerUserId: string;
    readonly preset: string;
    readonly reportId?: string;
    readonly sorts?: readonly string[];
    readonly status: string;
}): SavedReportDraft => ({
    ...(reportId ? { reportId } : {}),
    ownerUserId,
    name,
    formatId,
    displayFields,
    sorts,
    filters: normalizeReportFilters(
        filters.filter(
            (filter) =>
                filter.field &&
                (filter.value.trim() ||
                    filter.operator === 'is-empty' ||
                    filter.operator === 'is-not-empty' ||
                    filter.promptAtRun),
        ),
    ),
    preset,
    status,
});

/** Reads the report definition the operator chose as their personal default. */
export const readDefaultSavedReportId = (userId: string): string => {
    try {
        const defaults = JSON.parse(
            window.localStorage.getItem(defaultReportsStorageKey) ?? '{}',
        ) as Readonly<Record<string, string>>;
        return defaults[userId] ?? '';
    } catch {
        return '';
    }
};

/** Stores the operator's personal default saved report. */
export const saveDefaultSavedReportId = (userId: string, reportId: string): void => {
    let defaults: Record<string, string> = {};
    try {
        defaults = JSON.parse(
            window.localStorage.getItem(defaultReportsStorageKey) ?? '{}',
        ) as Record<string, string>;
    } catch {
        defaults = {};
    }
    window.localStorage.setItem(
        defaultReportsStorageKey,
        JSON.stringify({ ...defaults, [userId]: reportId }),
    );
};

/** Creates or updates a custom report, enforcing the per-operator quota. */
export const saveCustomSavedReport = (report: SavedReportDraft): SavedReportDefinition => {
    const reports = readCustomSavedReports();
    const existing = report.reportId
        ? reports.find((candidate) => candidate.reportId === report.reportId)
        : undefined;
    const ownedCustomCount = reports.filter(
        (candidate) => candidate.ownerUserId === report.ownerUserId,
    ).length;
    if (!existing && ownedCustomCount >= customReportLimitPerUser) {
        throw new Error('Each operator can create up to five custom reports.');
    }
    const saved: SavedReportDefinition = {
        ...report,
        reportId: report.reportId ?? `report-${crypto.randomUUID()}`,
        isBuiltIn: false,
        createdAt: existing?.createdAt ?? nowIso(),
        updatedAt: nowIso(),
    };
    writeCustomSavedReports(
        existing
            ? reports.map((candidate) =>
                  candidate.reportId === saved.reportId ? saved : candidate,
              )
            : [...reports, saved],
    );
    return saved;
};

/** Deletes a custom report when requested by the creator or System Administrator. */
export const deleteCustomSavedReport = (reportId: string, userId: string, isSysAdmin: boolean) => {
    const report = readCustomSavedReports().find((candidate) => candidate.reportId === reportId);
    if (!report) return;
    if (report.ownerUserId !== userId && !isSysAdmin) {
        throw new Error('Only the creator or System Administrator can delete this report.');
    }
    writeCustomSavedReports(
        readCustomSavedReports().filter((candidate) => candidate.reportId !== reportId),
    );
};

/** Returns whether the active operator can edit or delete a saved report. */
export const canManageSavedReport = (
    report: SavedReportDefinition,
    userId: string,
    isSysAdmin: boolean,
): boolean => !report.isBuiltIn && (isSysAdmin || report.ownerUserId === userId);

/** Creates a custom copy of a saved report for the active operator. */
export const duplicateSavedReport = ({
    ownerUserId,
    report,
}: {
    readonly ownerUserId: string;
    readonly report: SavedReportDefinition;
}): SavedReportDefinition =>
    saveCustomSavedReport({
        ownerUserId,
        name: `${report.name} copy`,
        formatId: report.formatId,
        displayFields: report.displayFields,
        sorts: report.sorts,
        filters: report.filters.map((filter) => ({
            ...filter,
            id: crypto.randomUUID(),
        })),
        preset: report.preset,
        status: report.status,
    });
