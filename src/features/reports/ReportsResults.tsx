/** @format */

import type { FC, RefObject } from 'react';

import { Search } from 'lucide-react';

import type { AppRecord } from '../records/RecordStoreSupport';
import { buildReportTableModel } from './ReportsPageTableModel';

type ReportsResultsProps = {
    readonly displayFields: readonly string[];
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

export const ReportsResults: FC<ReportsResultsProps> = ({
    displayFields,
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

    const table = buildReportTableModel(reportId, records, displayFields);

    return (
        <div className="product-table-wrap">
            <table className="product-table">
                <thead>
                    <tr>
                        {table.columns.map((column) => (
                            <th
                                className={column.align === 'right' ? 'numeric-cell' : undefined}
                                key={column.key}
                            >
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {table.rows.map((row, rowIndex) => (
                        <tr key={`${reportId}-row-${String(rowIndex)}`}>
                            {row.map((value, columnIndex) => (
                                <td
                                    className={
                                        table.columns[columnIndex]?.align === 'right'
                                            ? 'numeric-cell'
                                            : undefined
                                    }
                                    key={`${table.columns[columnIndex]?.key ?? 'column'}-${String(columnIndex)}`}
                                >
                                    {value}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
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
