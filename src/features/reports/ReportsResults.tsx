/** @format */

import type { FC, RefObject } from 'react';

import { Search } from 'lucide-react';

import type { AppRecord } from '../records/RecordStoreSupport';
import { buildCustomerLedger, buildTaxSummary } from './ReportsPageRenderingSupport';

type ReportsResultsProps = {
    readonly reportId: string;
    readonly records: readonly AppRecord[];
    readonly isLoading: boolean;
    readonly pageLoading: boolean;
    readonly totalRecords: number;
    readonly matchingCount: number;
    readonly usesServerPaging: boolean;
    readonly nextCursor: string | undefined;
    readonly sentinelRef: RefObject<HTMLDivElement | null>;
};

const ReportRow: FC<{ readonly record: AppRecord }> = ({ record }) => (
    <tr>
        <td>{record.documentNumber ?? 'Draft record'}</td>
        <td>{record.invoiceDate}</td>
        <td>{record.customerName}</td>
        <td>{record.gstin}</td>
        <td>
            <span className="status-pill">{record.status}</span>
        </td>
        <td className="numeric-cell">₹{record.grandTotal}</td>
    </tr>
);

export const ReportsResults: FC<ReportsResultsProps> = ({
    reportId,
    records,
    isLoading,
    pageLoading,
    totalRecords,
    matchingCount,
    usesServerPaging,
    nextCursor,
    sentinelRef,
}) => {
    if (isLoading || (pageLoading && records.length === 0)) {
        return <div className="empty-panel">Loading report data…</div>;
    }
    if (totalRecords === 0) {
        return (
            <div className="empty-panel">
                <Search aria-hidden="true" />
                <h2>No matching records</h2>
                <p>Adjust the filters or finalize a record first.</p>
            </div>
        );
    }

    return (
        <div className="product-table-wrap">
            {reportId === 'tax-summary' ? (
                <table className="product-table">
                    <thead>
                        <tr>
                            <th>Tax rate</th>
                            <th className="numeric-cell">Taxable value</th>
                            <th className="numeric-cell">Tax amount</th>
                            <th className="numeric-cell">Finalized lines</th>
                        </tr>
                    </thead>
                    <tbody>
                        {buildTaxSummary(records).map((row) => (
                            <tr key={row.rate}>
                                <td>{row.rate}%</td>
                                <td className="numeric-cell">₹{row.taxable.toFixed(2)}</td>
                                <td className="numeric-cell">₹{row.tax.toFixed(2)}</td>
                                <td className="numeric-cell">{row.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : reportId === 'customer-ledger' ? (
                <table className="product-table">
                    <thead>
                        <tr>
                            <th>Customer name</th>
                            <th>GSTIN</th>
                            <th>Latest record date</th>
                            <th className="numeric-cell">Record count</th>
                            <th className="numeric-cell">Cancelled</th>
                            <th className="numeric-cell">Finalized revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        {buildCustomerLedger(records).map((row) => (
                            <tr key={`${row.customer}:${row.gstin}`}>
                                <td>{row.customer}</td>
                                <td>{row.gstin}</td>
                                <td>{row.latestDate}</td>
                                <td className="numeric-cell">{row.documents}</td>
                                <td className="numeric-cell">{row.cancelled}</td>
                                <td className="numeric-cell">₹{row.revenue.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <table className="product-table">
                    <thead>
                        <tr>
                            <th>Record number</th>
                            <th>Date</th>
                            <th>Customer name</th>
                            <th>GSTIN</th>
                            <th>Status</th>
                            <th className="numeric-cell">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((record) => (
                            <ReportRow key={record.recordId} record={record} />
                        ))}
                    </tbody>
                </table>
            )}
            <div className="report-sentinel" ref={sentinelRef}>
                {usesServerPaging
                    ? nextCursor
                        ? pageLoading
                            ? 'Loading more…'
                            : 'Scroll for more'
                        : 'End of results'
                    : records.length < matchingCount
                      ? 'Loading more…'
                      : 'End of results'}
            </div>
        </div>
    );
};
