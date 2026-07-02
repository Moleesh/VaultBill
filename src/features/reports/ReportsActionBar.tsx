/** @format */

import type { FC } from 'react';

import { Printer, RotateCcw, Sheet } from 'lucide-react';

import { ActionButton } from '../../components/ActionButton';
import { IconButton } from '../../components/IconButton';
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
                    <ActionButton
                        key={filter.id}
                        onClick={() => {
                            onClearReportFilter(filter.id);
                        }}
                    >
                        {formatReportFieldLabel(filter.field)}: {filter.value} ×
                    </ActionButton>
                ))}
            {fromDate || toDate ? (
                <ActionButton onClick={onClearDateRange}>Date range ×</ActionButton>
            ) : null}
            {status !== 'All' ? (
                <ActionButton onClick={onClearStatus}>Status: {status} ×</ActionButton>
            ) : null}
            {preset !== 'All' ? (
                <ActionButton onClick={onClearPreset}>
                    Quick filters: {preset === 'Last100' ? 'Last 100' : preset} ×
                </ActionButton>
            ) : null}
            <IconButton
                icon={<RotateCcw aria-hidden="true" size={16} />}
                onClick={onReset}
                variant="secondary"
            >
                Reset filters
            </IconButton>
        </div>
        <div className="report-toolbar">
            <div>
                <strong>
                    {visibleCount} of {totalRecords} records loaded
                </strong>
                <small> Latest records appear first.</small>
            </div>
            <div>
                <IconButton
                    disabled={!canExport}
                    icon={<Sheet aria-hidden="true" size={17} />}
                    onClick={onExportAll}
                >
                    Export
                </IconButton>
                <IconButton
                    disabled={!canPrintReport}
                    icon={<Printer aria-hidden="true" size={17} />}
                    onClick={onPrintReport}
                >
                    Print report
                </IconButton>
                <IconButton
                    disabled={!canPrintRecords}
                    icon={<Printer aria-hidden="true" size={17} />}
                    onClick={onPrintRecords}
                    variant="primary"
                >
                    Print records
                </IconButton>
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
