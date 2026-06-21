/** @format */

import { useForm } from '@tanstack/react-form';
import { useMemo, useState } from 'react';

import { useRecordStore } from '../records/RecordStoreContext';
import {
    createReportFilter,
    defaultReportField,
    matchesReportField,
} from './ReportsPageFilterSupport';
import { pageSize } from './ReportsPageSupport';
import type { ReportFieldFilter } from './ReportsPageTypes';

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
export const useReportsPageFilters = (includeDraftsInReports: boolean) => {
    const { records } = useRecordStore();
    const [additionalFilters, setAdditionalFilters] = useState<readonly ReportFieldFilter[]>([]);
    const [visibleCount, setVisibleCount] = useState(pageSize);
    const form = useReportsFilterForm();
    const { fromDate, preset, reportField, reportFieldValue, reportId, status, toDate } =
        form.state.values;
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
            includeDraftsInReports,
            limit: pageSize,
        }),
        [fromDate, includeDraftsInReports, preset, reportFilters, reportId, status, toDate],
    );
    const customers = [
        ...new Set(records.map((record) => record.customerName).filter(Boolean)),
    ].sort();
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
    };
    const setReportField = (value: string) => {
        form.setFieldValue('reportField', value);
        form.setFieldValue('reportFieldValue', '');
    };
    const setReportFieldValue = (value: string) => {
        form.setFieldValue('reportFieldValue', value);
    };
    const addReportFilter = () => {
        setAdditionalFilters((current) => [...current, createReportFilter()]);
    };
    const updateReportFilter = (id: string, next: Partial<ReportFieldFilter>) => {
        if (id === 'primary') {
            if (typeof next.field === 'string') form.setFieldValue('reportField', next.field);
            if (typeof next.value === 'string') form.setFieldValue('reportFieldValue', next.value);
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
    } as const;
};
