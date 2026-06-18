/** @format */

import type { FC } from 'react';

import { Plus } from 'lucide-react';

import { AppDatePicker } from '../../components/AppDatePicker/AppDatePicker';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import { reportFieldOptions, reportOptions } from './ReportsPageSupport';
import type { ReportFieldFilter } from './ReportsPageTypes';

type ReportsFilterPanelProps = {
    readonly reportId: string;
    readonly onReportIdChange: (value: string) => void;
    readonly reportFilters: readonly ReportFieldFilter[];
    readonly onAddFilter: () => void;
    readonly onUpdateFilter: (id: string, next: Partial<ReportFieldFilter>) => void;
    readonly onRemoveFilter: (id: string) => void;
    readonly fromDate: string;
    readonly onFromDateChange: (value: string) => void;
    readonly toDate: string;
    readonly onToDateChange: (value: string) => void;
    readonly status: string;
    readonly onStatusChange: (value: string) => void;
    readonly preset: string;
    readonly onPresetChange: (value: string) => void;
    readonly customers: readonly string[];
};

const reportFieldValuePlaceholder = (field: string): string => {
    if (field === 'customerName') return 'Enter value';
    if (field === 'documentNumber') return 'Enter value';
    if (field === 'gstin') return 'GSTIN';
    if (field === 'invoiceDate') return 'Choose date';
    if (field === 'grandTotal') return 'Amount';
    if (field === 'status') return 'Choose status';
    return 'Enter value';
};

const renderReportFieldValue = (
    filter: ReportFieldFilter,
    customers: readonly string[],
    onUpdateFilter: (id: string, next: Partial<ReportFieldFilter>) => void,
) => {
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
        <label>
            <span>Filter value</span>
            <input
                list={
                    filter.field === 'customerName' ? `report-field-values-${filter.id}` : undefined
                }
                placeholder={reportFieldValuePlaceholder(filter.field)}
                value={filter.value}
                onChange={(event) => {
                    onUpdateFilter(filter.id, { value: event.currentTarget.value });
                }}
            />
            {filter.field === 'customerName' ? (
                <datalist id={`report-field-values-${filter.id}`}>
                    {customers.map((name) => (
                        <option key={name} value={name} />
                    ))}
                </datalist>
            ) : null}
        </label>
    );
};

export const ReportsFilterPanel: FC<ReportsFilterPanelProps> = ({
    reportId,
    onReportIdChange,
    reportFilters,
    onAddFilter,
    onUpdateFilter,
    onRemoveFilter,
    fromDate,
    onFromDateChange,
    toDate,
    onToDateChange,
    status,
    onStatusChange,
    preset,
    onPresetChange,
    customers,
}) => (
    <>
        <div className="page-hero page-hero--compact reports-hero">
            <div>
                <p className="eyebrow">Reports</p>
                <h1>Business reports</h1>
                <p>Search records, then export or print exactly what matches.</p>
            </div>
            <div className="reports-hero-controls">
                <SearchableDropdown
                    label="Report"
                    onChange={onReportIdChange}
                    options={reportOptions.map((option) => ({ ...option }))}
                    value={reportId}
                />
            </div>
        </div>
        <section className="data-panel">
            <div className="report-filter-stack">
                {reportFilters.map((filter, index) => (
                    <div className="report-filter-row" key={filter.id}>
                        <SearchableDropdown
                            label="Report field"
                            onChange={(value) => {
                                onUpdateFilter(filter.id, { field: value, value: '' });
                            }}
                            options={reportFieldOptions.map((option) => ({ ...option }))}
                            value={filter.field}
                        />
                        <div className="report-filter-row-value">
                            {renderReportFieldValue(filter, customers, onUpdateFilter)}
                            <button onClick={onAddFilter} type="button">
                                <Plus aria-hidden="true" size={16} /> Add another filter
                            </button>
                        </div>
                        <div className="report-filter-row-actions">
                            {index > 0 ? (
                                <button
                                    onClick={() => {
                                        onRemoveFilter(filter.id);
                                    }}
                                    type="button"
                                >
                                    Remove filter
                                </button>
                            ) : null}
                        </div>
                    </div>
                ))}
            </div>
            <div className="report-filter-grid report-filter-grid--secondary">
                <AppDatePicker label="From" onChange={onFromDateChange} value={fromDate} />
                <AppDatePicker label="To" onChange={onToDateChange} value={toDate} />
                <SearchableDropdown
                    label="Status"
                    value={status}
                    onChange={onStatusChange}
                    options={['All', 'Draft', 'Finalized', 'Cancelled'].map((value) => ({
                        value,
                        label: value,
                    }))}
                />
                <SearchableDropdown
                    label="Quick filters"
                    value={preset}
                    onChange={onPresetChange}
                    options={[
                        { value: 'All', label: 'All time' },
                        { value: 'Today', label: 'Today' },
                        { value: 'ThisMonth', label: 'This month' },
                        { value: 'FinancialYear', label: 'Financial year' },
                        { value: 'Last100', label: 'Last 100' },
                    ]}
                />
            </div>
        </section>
    </>
);
