/** @format */

import { Printer, RotateCcw, Sheet } from 'lucide-react';
import type { FC } from 'react';

const formatFieldLabel = (field: string): string =>
    ({
        customerName: 'Customer name',
        documentNumber: 'Document number',
        gstin: 'GSTIN',
        invoiceDate: 'Invoice date',
        grandTotal: 'Grand total',
        status: 'Status',
    })[field] ?? field;

type ReportsActionBarProps = {
    readonly customer: string;
    readonly invoiceNumber: string;
    readonly fromDate: string;
    readonly toDate: string;
    readonly status: string;
    readonly reportField: string;
    readonly reportFieldValue: string;
    readonly preset: string;
    readonly onClearCustomer: () => void;
    readonly onClearInvoiceNumber: () => void;
    readonly onClearDateRange: () => void;
    readonly onClearStatus: () => void;
    readonly onClearReportField: () => void;
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
    customer,
    invoiceNumber,
    fromDate,
    toDate,
    status,
    reportField,
    reportFieldValue,
    preset,
    onClearCustomer,
    onClearInvoiceNumber,
    onClearDateRange,
    onClearStatus,
    onClearReportField,
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
            {customer ? (
                <button onClick={onClearCustomer} type="button">
                    Customer: {customer} ×
                </button>
            ) : null}
            {invoiceNumber ? (
                <button onClick={onClearInvoiceNumber} type="button">
                    Invoice: {invoiceNumber} ×
                </button>
            ) : null}
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
            {reportField !== 'customerName' || reportFieldValue ? (
                <button onClick={onClearReportField} type="button">
                    Field: {formatFieldLabel(reportField)}
                    {reportFieldValue ? ` = ${reportFieldValue}` : ''} ×
                </button>
            ) : null}
            {preset !== 'All' ? (
                <button onClick={onClearPreset} type="button">
                    Range: {preset === 'Last100' ? 'Last 100' : preset} ×
                </button>
            ) : null}
            <button onClick={onReset} type="button">
                <RotateCcw aria-hidden="true" size={16} /> Clear all
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
