/** @format */

import type { FC } from 'react';

import { AppDatePicker } from '../../components/AppDatePicker/AppDatePicker';
import { FormField } from '../../components/FormFields';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import type { ReportFieldFilter } from './ReportsPageTypes';

const reportFieldValuePlaceholder = (field: string): string => {
    if (field === 'gstin') return 'GSTIN';
    if (field === 'invoiceDate') return 'Choose date';
    if (field === 'grandTotal') return 'Amount';
    if (field === 'status') return 'Choose status';
    return 'Enter value';
};

type ReportFieldValueControlProps = {
    readonly customers: readonly string[];
    readonly filter: ReportFieldFilter;
    readonly onUpdateFilter: (id: string, next: Partial<ReportFieldFilter>) => void;
};

/** Shared field-value control that adapts to the selected report filter type. */
export const ReportFieldValueControl: FC<ReportFieldValueControlProps> = ({
    customers,
    filter,
    onUpdateFilter,
}) => {
    if (filter.field === 'status') {
        return (
            <SearchableDropdown
                label="Filter value"
                onChange={(value) => {
                    onUpdateFilter(filter.id, { value });
                }}
                options={['All', 'Draft', 'Finalized', 'Cancelled'].map((value) => ({
                    value,
                    label: value,
                }))}
                value={filter.value || 'All'}
            />
        );
    }
    if (filter.field === 'invoiceDate') {
        return (
            <AppDatePicker
                label="Value"
                onChange={(value) => {
                    onUpdateFilter(filter.id, { value });
                }}
                value={filter.value}
            />
        );
    }
    return (
        <>
            <FormField.TextField
                label="Filter value"
                list={
                    filter.field === 'customerName' ? `report-field-values-${filter.id}` : undefined
                }
                onChange={(event) => {
                    onUpdateFilter(filter.id, { value: event.currentTarget.value });
                }}
                placeholder={reportFieldValuePlaceholder(filter.field)}
                value={filter.value}
            />
            {filter.field === 'customerName' ? (
                <datalist id={`report-field-values-${filter.id}`}>
                    {customers.map((name) => (
                        <option key={name} value={name} />
                    ))}
                </datalist>
            ) : null}
        </>
    );
};
