/** @format */

import { Printer, RotateCcw, Sheet } from 'lucide-react';
import type { FC } from 'react';

import { formatReportFieldLabel } from './ReportsPageSupport';
import type { ReportFieldFilter } from './ReportsPageTypes';

type ReportsActionBarProps = {
    readonly reportFilters: readonly ReportFieldFilter[];
    readonly fromDate: string;
    readonly toDate: string;
    readonly status: string;
    readonly preset: string;
    readonly onClearDateRange: () => void;
    readonly onClearStatus: () => void;
    readonly onClearReportFilter: (id: string) => void;
    readonly onClearPreset: () => void;
    readonly onReset: () => void;
    readonly visibleCount: number;
    readonly totalRecords: number;
    readonly onExportAll: () => void;
    readonly onPrintReport: () => void;
    readonly onPrintRecords: () => void;
    readonly canExport: boolean;
    readonly canPrintReport: boolean;
    readonly canPrintRecords: boolean;
    readonly trialExpired: boolean;
};

export const ReportsActionBar: FC<ReportsActionBarProps> = ({
    reportFilters,
    fromDate,
    toDate,
    status,
    preset,
    onClearDateRange,
    onClearStatus,
    onClearReportFilter,
    onClearPreset,
    onReset,
    visibleCount,
    totalRecords,
    onExportAll,
    onPrintReport,
    onPrintRecords,
    canExport,
    canPrintReport,
    canPrintRecords,
    trialExpired,
}) => (
    <>
        <div className="filter-chips" aria-label="Active filters">
            {reportFilters
                .filter(
                    (filter) =>
                        filter.value.trim() &&
                        !(filter.field === 'status' && filter.value.trim() === 'All'),
                )
                .map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => {
                            onClearReportFilter(filter.id);
                        }}
                        type="button"
                    >
                        {formatReportFieldLabel(filter.field)}: {filter.value} ×
                    </button>
                ))}
            {fromDate || toDate ? (
                <button onClick={onClearDateRange} type="button">
                    Date range ×
                </button>
            ) : null}
            {status !== 'All' ? (
                <button onClick={onClearStatus} type="button">
                    Status: {status} ×
                </button>
            ) : null}
            {preset !== 'All' ? (
                <button onClick={onClearPreset} type="button">
                    Quick filters: {preset === 'Last100' ? 'Last 100' : preset} ×
                </button>
            ) : null}
            <button className="button-secondary" onClick={onReset} type="button">
                <RotateCcw aria-hidden="true" size={16} /> Reset filters
            </button>
        </div>
        <div className="report-toolbar">
            <div>
                <strong>
                    {visibleCount} of {totalRecords} records loaded
                </strong>
                <small> Latest records appear first.</small>
            </div>
            <div>
                <button disabled={!canExport} onClick={onExportAll} type="button">
                    <Sheet aria-hidden="true" size={17} /> Export
                </button>
                <button disabled={!canPrintReport} onClick={onPrintReport} type="button">
                    <Printer aria-hidden="true" size={17} /> Print report
                </button>
                <button
                    className="button-primary"
                    disabled={!canPrintRecords}
                    onClick={onPrintRecords}
                    type="button"
                >
                    <Printer aria-hidden="true" size={17} /> Print records
                </button>
            </div>
        </div>
        {trialExpired ? (
            <p className="feedback-info">
                The trial is read-only. Reports remain viewable, but export and printing require
                activation.
            </p>
        ) : null}
    </>
);
