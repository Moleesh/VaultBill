/** @format */

import type { FC } from 'react';

import { ActionButton } from '../../components/ActionButton';
import type { AppRecord } from './RecordStoreContext';

type RecordCollectionProps = {
    readonly error: string;
    readonly isLoading: boolean;
    readonly records: readonly AppRecord[];
    readonly selectedRecordId?: string;
    readonly onSelect: (record: AppRecord) => void;
};

export const RecordCollection: FC<RecordCollectionProps> = ({
    error,
    isLoading,
    onSelect,
    records,
    selectedRecordId,
}) => {
    if (isLoading) {
        return (
            <section aria-live="polite" className="empty-panel">
                <p className="eyebrow">Reprint</p>
                <h2>Loading records</h2>
                <div className="loading-skeleton" />
            </section>
        );
    }

    if (records.length === 0) {
        return (
            <section className="empty-panel">
                <p className="eyebrow">Reprint</p>
                <h2>No finalized records yet</h2>
                <p>
                    {error ||
                        'Finalize a document and it will appear here for read-only reprinting.'}
                </p>
            </section>
        );
    }

    return (
        <div className="product-table-wrap">
            {error ? <p className="feedback-error">{error}</p> : null}
            <table className="product-table">
                <thead>
                    <tr>
                        <th>Document</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th className="numeric-cell">Amount</th>
                        <th aria-label="Actions" />
                    </tr>
                </thead>
                <tbody>
                    {records.map((record) => (
                        <tr
                            className={record.recordId === selectedRecordId ? 'is-selected' : ''}
                            key={record.recordId}
                        >
                            <td>{record.documentNumber ?? 'Draft'}</td>
                            <td>{record.customerName || 'Unnamed customer'}</td>
                            <td>{record.invoiceDate}</td>
                            <td>
                                <span className="status-pill">{record.status}</span>
                            </td>
                            <td className="numeric-cell">₹{record.grandTotal}</td>
                            <td>
                                <ActionButton
                                    onClick={() => {
                                        onSelect(record);
                                    }}
                                >
                                    Open
                                </ActionButton>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
