/** @format */

import { Printer, RotateCcw, Sheet } from 'lucide-react';
import type { FC } from 'react';

type ReportsActionBarProps = {
    readonly customer: string;
    readonly invoiceNumber: string;
    readonly fromDate: string;
    readonly toDate: string;
    readonly status: string;
    readonly onClearCustomer: () => void;
    readonly onClearInvoiceNumber: () => void;
    readonly onClearDateRange: () => void;
    readonly onClearStatus: () => void;
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
    onClearCustomer,
    onClearInvoiceNumber,
    onClearDateRange,
    onClearStatus,
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
