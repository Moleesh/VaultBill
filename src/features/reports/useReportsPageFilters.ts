/** @format */

import { useMemo, useState } from 'react';

import { useRecordStore } from '../records/RecordStoreContext';
import { pageSize } from './ReportsPageSupport';
import type { ReportFieldFilter } from './ReportsPageTypes';

const defaultReportField = '';

const createReportFilter = (field: string = defaultReportField, value = ''): ReportFieldFilter => ({
    id: globalThis.crypto.randomUUID(),
    field,
    value,
});

const normalizeValue = (value: unknown): string =>
    typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
        ? String(value)
        : '';

const reportFieldValueFor = (record: Parameters<typeof matchesReportField>[0], field: string) => {
    if (field === 'documentNumber') return record.documentNumber ?? '';
    if (field === 'customerName') return record.customerName;
    if (field === 'gstin') return record.gstin;
    if (field === 'invoiceDate') return record.invoiceDate;
    if (field === 'status') return record.status;
    if (field === 'grandTotal') return record.grandTotal;
    return '';
};

const matchesReportField = (
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

export const useReportsPageFilters = () => {
    const { records } = useRecordStore();
    const includeDraftsInReports =
        typeof window !== 'undefined' &&
        window.localStorage.getItem('vaultbill.reports.include-drafts') === 'true';
    const [reportId, setReportId] = useState('sales-register');
    const [reportField, setReportFieldState] = useState(defaultReportField);
    const [reportFieldValue, setReportFieldValueState] = useState('');
    const [additionalFilters, setAdditionalFilters] = useState<readonly ReportFieldFilter[]>([]);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [status, setStatus] = useState('All');
    const [preset, setPreset] = useState('All');
    const [visibleCount, setVisibleCount] = useState(pageSize);

    const reportFilters = useMemo(
        () => [
            { id: 'primary', field: reportField, value: reportFieldValue },
            ...additionalFilters,
        ],
        [additionalFilters, reportField, reportFieldValue],
    );

    const browserMatchingRecords = useMemo(() => {
        let result = records
            .filter((record) => includeDraftsInReports || record.status !== 'Draft')
            .filter((record) => status === 'All' || record.status === status)
            .filter((record) => !fromDate || record.invoiceDate >= fromDate)
            .filter((record) => !toDate || record.invoiceDate <= toDate)
            .filter((record) => reportFilters.every((filter) => matchesReportField(record, filter)))
            .sort(
                (left, right) =>
                    right.updatedAt.localeCompare(left.updatedAt) ||
                    left.recordId.localeCompare(right.recordId),
            );
        if (preset === 'Last100') result = result.slice(0, 100);
        return result;
    }, [fromDate, includeDraftsInReports, preset, records, reportFilters, status, toDate]);

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
            limit: pageSize,
        }),
        [fromDate, preset, reportFilters, reportId, status, toDate],
    );

    const customers = [
        ...new Set(records.map((record) => record.customerName).filter(Boolean)),
    ].sort();

    const reset = () => {
        setReportFieldState(defaultReportField);
        setReportFieldValueState('');
        setAdditionalFilters([]);
        setFromDate('');
        setToDate('');
        setStatus('All');
        setPreset('All');
    };

    const setReportField = (value: string) => {
        setReportFieldState(value);
        setReportFieldValueState('');
    };

    const setReportFieldValue = (value: string) => {
        setReportFieldValueState(value);
    };

    const addReportFilter = () => {
        setAdditionalFilters((current) => [...current, createReportFilter()]);
    };

    const updateReportFilter = (id: string, next: Partial<ReportFieldFilter>) => {
        if (id === 'primary') {
            if (typeof next.field === 'string') setReportFieldState(next.field);
            if (typeof next.value === 'string') setReportFieldValueState(next.value);
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
        setPreset(value);
        if (value === 'Last100' || value === 'All') {
            setFromDate('');
            setToDate('');
            return;
        }
        const now = new Date();
        const today = now.toISOString().slice(0, 10);
        if (value === 'Today') {
            setFromDate(today);
            setToDate(today);
        }
        if (value === 'ThisMonth') {
            setFromDate(`${today.slice(0, 7)}-01`);
            setToDate(today);
        }
        if (value === 'FinancialYear') {
            const year = now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
            setFromDate(`${String(year)}-04-01`);
            setToDate(today);
        }
    };

    return {
        addReportFilter,
        applyPreset,
        browserMatchingRecords,
        customers,
        fromDate,
        query,
        reportId,
        reportField,
        reportFieldValue,
        reportFilters,
        reset,
        removeReportFilter,
        setFromDate,
        setPreset,
        setReportField,
        setReportFieldValue,
        setReportId,
        setStatus,
        setToDate,
        toDate,
        status,
        preset,
        visibleCount,
        setVisibleCount,
        updateReportFilter,
    } as const;
};
