/** @format */

import type { FC } from 'react';

import { Plus } from 'lucide-react';

import { ActionButton } from '../../components/ActionButton';
import { AppDatePicker } from '../../components/AppDatePicker/AppDatePicker';
import { IconButton } from '../../components/IconButton';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import { ReportFieldValueControl } from './ReportsFilterPanelSupport';
import { reportFieldOptions, reportOptions } from './ReportsPageSupport';
import type { ReportFieldFilter } from './ReportsPageTypes';
import type { ReportsFilterFormApi } from './useReportsPageFilters';

type ReportsFilterPanelProps = {
    readonly form: ReportsFilterFormApi;
    readonly reportFilters: readonly ReportFieldFilter[];
    readonly onAddFilter: () => void;
    readonly onUpdateFilter: (id: string, next: Partial<ReportFieldFilter>) => void;
    readonly onRemoveFilter: (id: string) => void;
    readonly onPresetChange: (value: string) => void;
    readonly customers: readonly string[];
};

export const ReportsFilterPanel: FC<ReportsFilterPanelProps> = ({
    form,
    reportFilters,
    onAddFilter,
    onUpdateFilter,
    onRemoveFilter,
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
                <form.Field name="reportId">
                    {(field) => (
                        <SearchableDropdown
                            label="Report"
                            onChange={(value) => {
                                field.handleChange(value);
                            }}
                            options={reportOptions.map((option) => ({ ...option }))}
                            value={field.state.value}
                        />
                    )}
                </form.Field>
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
                            <ReportFieldValueControl
                                customers={customers}
                                filter={filter}
                                onUpdateFilter={onUpdateFilter}
                            />
                            <IconButton
                                icon={<Plus aria-hidden="true" size={16} />}
                                onClick={onAddFilter}
                            >
                                Add another filter
                            </IconButton>
                        </div>
                        <div className="report-filter-row-actions">
                            {index > 0 ? (
                                <ActionButton
                                    onClick={() => {
                                        onRemoveFilter(filter.id);
                                    }}
                                >
                                    Remove filter
                                </ActionButton>
                            ) : null}
                        </div>
                    </div>
                ))}
            </div>
            <div className="report-filter-grid report-filter-grid--secondary">
                <form.Field name="fromDate">
                    {(field) => (
                        <AppDatePicker
                            label="From"
                            onChange={(value) => {
                                field.handleChange(value);
                            }}
                            value={field.state.value}
                        />
                    )}
                </form.Field>
                <form.Field name="toDate">
                    {(field) => (
                        <AppDatePicker
                            label="To"
                            onChange={(value) => {
                                field.handleChange(value);
                            }}
                            value={field.state.value}
                        />
                    )}
                </form.Field>
                <form.Field name="status">
                    {(field) => (
                        <SearchableDropdown
                            label="Status"
                            value={field.state.value}
                            onChange={(value) => {
                                field.handleChange(value);
                            }}
                            options={['All', 'Draft', 'Finalized', 'Cancelled'].map((value) => ({
                                value,
                                label: value,
                            }))}
                        />
                    )}
                </form.Field>
                <form.Field name="preset">
                    {(field) => (
                        <SearchableDropdown
                            label="Quick filters"
                            value={field.state.value}
                            onChange={(value) => {
                                onPresetChange(value);
                            }}
                            options={[
                                { value: 'All', label: 'All time' },
                                { value: 'Today', label: 'Today' },
                                { value: 'ThisMonth', label: 'This month' },
                                { value: 'FinancialYear', label: 'Financial year' },
                                { value: 'Last100', label: 'Last 100' },
                            ]}
                        />
                    )}
                </form.Field>
            </div>
        </section>
    </>
);
