/** @format */

import { useEffect, useMemo, useState } from 'react';

import { useForm } from '@tanstack/react-form';

import type { Role } from '../../types/AppTypes';
import { useRecordStore } from '../records/RecordStoreContext';
import { defaultDisplayFieldsForReport } from './ReportsPageColumns';
import {
    compareReportRecordsBySorts,
    createReportFilter,
    defaultReportField,
    defaultReportSorts,
    matchesReportField,
} from './ReportsPageFilterSupport';
import { pageSize } from './ReportsPageSupport';
import type { ReportFieldFilter } from './ReportsPageTypes';
import {
    canManageSavedReport,
    createSavedReportDraft,
    deleteCustomSavedReport,
    duplicateSavedReport,
    normalizeReportFilters,
    readDefaultSavedReportId,
    readSavedReports,
    saveCustomSavedReport,
    saveDefaultSavedReportId,
    type SavedReportEditorInput,
    type SavedReportDefinition,
} from './SavedReportsSupport';

type ReportsFilterFormValues = {
    readonly fromDate: string;
    readonly preset: string;
    readonly reportField: string;
    readonly reportFieldValue: string;
    readonly reportId: string;
    readonly status: string;
    readonly toDate: string;
};

const useReportsFilterForm = () =>
    useForm({
        defaultValues: {
            fromDate: '',
            preset: 'All',
            reportField: defaultReportField,
            reportFieldValue: '',
            reportId: 'sales-register',
            status: 'All',
            toDate: '',
        } satisfies ReportsFilterFormValues,
    });

export type ReportsFilterFormApi = ReturnType<typeof useReportsFilterForm>;
export const useReportsPageFilters = (
    includeDraftsInReports: boolean,
    operator: { readonly role: Role; readonly userId: string } | undefined,
) => {
    const { records } = useRecordStore();
    const [additionalFilters, setAdditionalFilters] = useState<readonly ReportFieldFilter[]>([]);
    const [primaryFilterDetails, setPrimaryFilterDetails] = useState<
        Partial<Omit<ReportFieldFilter, 'field' | 'id' | 'value'>>
    >({});
    const [savedReports, setSavedReports] =
        useState<readonly SavedReportDefinition[]>(readSavedReports);
    const [selectedSavedReportId, setSelectedSavedReportId] = useState('');
    const [selectedReportSorts, setSelectedReportSorts] =
        useState<readonly string[]>(defaultReportSorts);
    const [selectedDisplayFields, setSelectedDisplayFields] = useState<readonly string[]>(
        defaultDisplayFieldsForReport('sales-register'),
    );
    const [isDynamicPromptOpen, setIsDynamicPromptOpen] = useState(false);
    const [visibleCount, setVisibleCount] = useState(pageSize);
    const form = useReportsFilterForm();
    const { fromDate, preset, reportField, reportFieldValue, reportId, status, toDate } =
        form.state.values;
    const filteredSavedReports = useMemo(
        () => savedReports.filter((report) => report.formatId === reportId),
        [reportId, savedReports],
    );
    const reportFilters = useMemo(
        () => [
            { id: 'primary', field: reportField, value: reportFieldValue, ...primaryFilterDetails },
            ...additionalFilters,
        ],
        [additionalFilters, primaryFilterDetails, reportField, reportFieldValue],
    );

    const browserMatchingRecords = useMemo(() => {
        let result = records
            .filter((record) => includeDraftsInReports || record.status !== 'Draft')
            .filter((record) => status === 'All' || record.status === status)
            .filter((record) => !fromDate || record.invoiceDate >= fromDate)
            .filter((record) => !toDate || record.invoiceDate <= toDate)
            .filter((record) => reportFilters.every((filter) => matchesReportField(record, filter)))
            .sort((left, right) => compareReportRecordsBySorts(left, right, selectedReportSorts));
        if (preset === 'Last100') result = result.slice(0, 100);
        return result;
    }, [
        fromDate,
        includeDraftsInReports,
        preset,
        records,
        reportFilters,
        selectedReportSorts,
        status,
        toDate,
    ]);
    const query = useMemo(
        () => ({
            reportId,
            reportFilters: reportFilters.filter(
                (filter) =>
                    filter.field &&
                    filter.value.trim() &&
                    !(filter.field === 'status' && filter.value.trim() === 'All'),
            ),
            fromDate,
            toDate,
            status,
            preset,
            includeDraftsInReports,
            sorts: selectedReportSorts,
            limit: pageSize,
        }),
        [
            fromDate,
            includeDraftsInReports,
            preset,
            reportFilters,
            reportId,
            selectedReportSorts,
            status,
            toDate,
        ],
    );
    const customers = [
        ...new Set(records.map((record) => record.customerName).filter(Boolean)),
    ].sort();
    const applySavedReport = (report: SavedReportDefinition) => {
        const normalizedFilters = normalizeReportFilters(report.filters);
        const primaryFilter = normalizedFilters[0];
        form.setFieldValue('reportId', report.formatId);
        form.setFieldValue('status', report.status);
        form.setFieldValue('preset', report.preset);
        form.setFieldValue('reportField', primaryFilter?.field ?? defaultReportField);
        form.setFieldValue('reportFieldValue', primaryFilter?.value ?? '');
        setPrimaryFilterDetails(
            primaryFilter
                ? {
                      ...(primaryFilter.caseInsensitive !== undefined
                          ? { caseInsensitive: primaryFilter.caseInsensitive }
                          : {}),
                      ...(primaryFilter.operator !== undefined
                          ? { operator: primaryFilter.operator }
                          : {}),
                      ...(primaryFilter.promptAtRun !== undefined
                          ? { promptAtRun: primaryFilter.promptAtRun }
                          : {}),
                      ...(primaryFilter.valueEnd !== undefined
                          ? { valueEnd: primaryFilter.valueEnd }
                          : {}),
                  }
                : {},
        );
        setAdditionalFilters(normalizedFilters.slice(1));
        setSelectedReportSorts(report.sorts.length > 0 ? report.sorts : defaultReportSorts);
        setSelectedDisplayFields(
            report.displayFields.length > 0
                ? report.displayFields
                : defaultDisplayFieldsForReport(report.formatId),
        );
        setIsDynamicPromptOpen(normalizedFilters.some((filter) => filter.promptAtRun));
    };
    useEffect(() => {
        if (!operator || selectedSavedReportId) return;
        const defaultReportId = readDefaultSavedReportId(operator.userId);
        if (!defaultReportId) return;
        const defaultReport = savedReports.find((report) => report.reportId === defaultReportId);
        if (!defaultReport) return;
        setSelectedSavedReportId(defaultReport.reportId);
        applySavedReport(defaultReport);
        // Run once after operator/default hydration.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [operator, savedReports, selectedSavedReportId]);
    useEffect(() => {
        if (!selectedSavedReportId) return;
        const selectedReport = savedReports.find(
            (report) => report.reportId === selectedSavedReportId,
        );
        if (!selectedReport || selectedReport.formatId === reportId) return;
        setSelectedSavedReportId('');
        setSelectedDisplayFields(defaultDisplayFieldsForReport(reportId));
        setIsDynamicPromptOpen(false);
    }, [reportId, savedReports, selectedSavedReportId]);
    const reset = () => {
        form.reset({
            fromDate: '',
            preset: 'All',
            reportField: defaultReportField,
            reportFieldValue: '',
            reportId,
            status: 'All',
            toDate: '',
        });
        setAdditionalFilters([]);
        setPrimaryFilterDetails({});
        setSelectedReportSorts(defaultReportSorts);
        setSelectedDisplayFields(defaultDisplayFieldsForReport(reportId));
        setSelectedSavedReportId('');
        setIsDynamicPromptOpen(false);
    };
    const setReportField = (value: string) => {
        form.setFieldValue('reportField', value);
        form.setFieldValue('reportFieldValue', '');
        setPrimaryFilterDetails({});
    };
    const setReportFieldValue = (value: string) => {
        form.setFieldValue('reportFieldValue', value);
    };
    const addReportFilter = () => {
        setAdditionalFilters((current) =>
            current.length >= 4 ? current : [...current, createReportFilter()],
        );
    };
    const updateReportFilter = (id: string, next: Partial<ReportFieldFilter>) => {
        if (id === 'primary') {
            if (typeof next.field === 'string') form.setFieldValue('reportField', next.field);
            if (typeof next.value === 'string') form.setFieldValue('reportFieldValue', next.value);
            setPrimaryFilterDetails((current) => ({
                ...current,
                ...(next.operator !== undefined ? { operator: next.operator } : {}),
                ...(next.valueEnd !== undefined ? { valueEnd: next.valueEnd } : {}),
                ...(next.caseInsensitive !== undefined
                    ? { caseInsensitive: next.caseInsensitive }
                    : {}),
                ...(next.promptAtRun !== undefined ? { promptAtRun: next.promptAtRun } : {}),
            }));
            return;
        }
        setAdditionalFilters((current) =>
            current.map((filter) => (filter.id === id ? { ...filter, ...next } : filter)),
        );
    };

    const removeReportFilter = (id: string) => {
        setAdditionalFilters((current) => current.filter((filter) => filter.id !== id));
    };
    const applyPreset = (value: string) => {
        form.setFieldValue('preset', value);
        if (value === 'Last100' || value === 'All') {
            form.setFieldValue('fromDate', '');
            form.setFieldValue('toDate', '');
            return;
        }
        const now = new Date();
        const today = now.toISOString().slice(0, 10);
        if (value === 'Today') {
            form.setFieldValue('fromDate', today);
            form.setFieldValue('toDate', today);
        }
        if (value === 'ThisMonth') {
            form.setFieldValue('fromDate', `${today.slice(0, 7)}-01`);
            form.setFieldValue('toDate', today);
        }
        if (value === 'FinancialYear') {
            const year = now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
            form.setFieldValue('fromDate', `${String(year)}-04-01`);
            form.setFieldValue('toDate', today);
        }
    };
    return {
        addReportFilter,
        applyPreset,
        browserMatchingRecords,
        customers,
        form,
        fromDate,
        query,
        reportId,
        reportField,
        reportFieldValue,
        reportFilters,
        reset,
        removeReportFilter,
        setFromDate: (value: string) => {
            form.setFieldValue('fromDate', value);
        },
        setPreset: (value: string) => {
            form.setFieldValue('preset', value);
        },
        setReportField,
        setReportFieldValue,
        setReportId: (value: string) => {
            form.setFieldValue('reportId', value);
            if (!selectedSavedReportId) {
                setSelectedDisplayFields(defaultDisplayFieldsForReport(value));
            }
        },
        setStatus: (value: string) => {
            form.setFieldValue('status', value);
        },
        setToDate: (value: string) => {
            form.setFieldValue('toDate', value);
        },
        toDate,
        status,
        preset,
        visibleCount,
        setVisibleCount,
        updateReportFilter,
        selectedSavedReportId,
        savedReports: filteredSavedReports,
        selectedDisplayFields,
        isDynamicPromptOpen,
        canAddReportFilter: reportFilters.length < 5,
        setSelectedSavedReportId: (reportId: string) => {
            setSelectedSavedReportId(reportId);
            const report = savedReports.find((candidate) => candidate.reportId === reportId);
            if (report) applySavedReport(report);
        },
        saveCurrentReport: (input: SavedReportEditorInput) => {
            if (!operator) throw new Error('Sign in before saving reports.');
            const saved = saveCustomSavedReport(
                createSavedReportDraft({
                    ownerUserId: operator.userId,
                    ...input,
                }),
            );
            setSavedReports(readSavedReports());
            setSelectedSavedReportId(saved.reportId);
            setSelectedReportSorts(saved.sorts);
            setSelectedDisplayFields(saved.displayFields);
            applySavedReport(saved);
        },
        duplicateSelectedSavedReport: () => {
            if (!operator || !selectedSavedReportId) return;
            const selectedReport = savedReports.find(
                (candidate) => candidate.reportId === selectedSavedReportId,
            );
            if (!selectedReport) return;
            const saved = duplicateSavedReport({
                ownerUserId: operator.userId,
                report: selectedReport,
            });
            setSavedReports(readSavedReports());
            setSelectedSavedReportId(saved.reportId);
            applySavedReport(saved);
        },
        setDefaultSavedReport: () => {
            if (!operator || !selectedSavedReportId) return;
            saveDefaultSavedReportId(operator.userId, selectedSavedReportId);
        },
        canManageReport: (report: SavedReportDefinition) =>
            operator
                ? canManageSavedReport(report, operator.userId, operator.role === 'SysAdmin')
                : false,
        canManageSelectedSavedReport: () => {
            if (!operator || !selectedSavedReportId) return false;
            const selectedReport = savedReports.find(
                (candidate) => candidate.reportId === selectedSavedReportId,
            );
            return selectedReport
                ? canManageSavedReport(
                      selectedReport,
                      operator.userId,
                      operator.role === 'SysAdmin',
                  )
                : false;
        },
        deleteSavedReportById: (reportId: string) => {
            if (!operator) return;
            deleteCustomSavedReport(reportId, operator.userId, operator.role === 'SysAdmin');
            setSavedReports(readSavedReports());
            if (selectedSavedReportId === reportId) {
                setSelectedSavedReportId('');
            }
        },
        deleteSelectedSavedReport: () => {
            if (!operator || !selectedSavedReportId) return;
            deleteCustomSavedReport(
                selectedSavedReportId,
                operator.userId,
                operator.role === 'SysAdmin',
            );
            setSavedReports(readSavedReports());
            setSelectedSavedReportId('');
        },
        closeDynamicPrompt: () => {
            setIsDynamicPromptOpen(false);
        },
    } as const;
};
