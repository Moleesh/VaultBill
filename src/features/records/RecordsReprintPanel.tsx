/** @format */

import type { FC } from 'react';

import { FormField } from '../../components/FormFields';
import { RecordCollection } from './RecordCollection';
import type { AppRecord } from './RecordStoreContext';
import type { RecordsReprintSearchFormApi } from './useRecordsPageStateSupport';

type RecordsReprintPanelProps = {
    readonly error: string;
    readonly form: RecordsReprintSearchFormApi;
    readonly isLoading: boolean;
    readonly onSelect: (record: AppRecord) => void;
    readonly records: readonly AppRecord[];
};

/** Renders the finalized-record search panel used for reprint mode. */
export const RecordsReprintPanel: FC<RecordsReprintPanelProps> = ({
    error,
    form,
    isLoading,
    onSelect,
    records,
}) => (
    <section className="data-panel">
        <form.Field name="searchQuery">
            {(field) => (
                <FormField.TextField
                    autoFocus
                    label="Search finalized records"
                    onChange={(event) => {
                        field.handleChange(event.currentTarget.value);
                    }}
                    placeholder="Document number or customer"
                    value={field.state.value}
                    wrapperClassName="record-search"
                />
            )}
        </form.Field>
        <RecordCollection
            error={error}
            isLoading={isLoading}
            onSelect={onSelect}
            records={records}
        />
    </section>
);
