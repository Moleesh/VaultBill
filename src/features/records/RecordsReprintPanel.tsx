/** @format */

import type { FC } from 'react';

import { RecordCollection } from './RecordCollection';
import type { AppRecord } from './RecordStoreContext';

type RecordsReprintPanelProps = {
    readonly error: string;
    readonly isLoading: boolean;
    readonly onSearchChange: (value: string) => void;
    readonly onSelect: (record: AppRecord) => void;
    readonly query: string;
    readonly records: readonly AppRecord[];
};

/** Renders the finalized-record search panel used for reprint mode. */
export const RecordsReprintPanel: FC<RecordsReprintPanelProps> = ({
    error,
    isLoading,
    onSearchChange,
    onSelect,
    query,
    records,
}) => (
    <section className="data-panel">
        <label className="record-search">
            <span>Search finalized records</span>
            <input
                autoFocus
                onChange={(event) => {
                    onSearchChange(event.currentTarget.value);
                }}
                placeholder="Document number or customer"
                value={query}
            />
        </label>
        <RecordCollection
            error={error}
            isLoading={isLoading}
            onSelect={onSelect}
            records={records}
        />
    </section>
);
