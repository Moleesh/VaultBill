/** @format */

import type { FC } from 'react';

import { AppDatePicker } from '../../components/AppDatePicker/AppDatePicker';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';

type ReportsFilterPanelProps = {
    readonly reportId: string;
    readonly onReportIdChange: (value: string) => void;
    readonly customer: string;
    readonly onCustomerChange: (value: string) => void;
    readonly invoiceNumber: string;
    readonly onInvoiceNumberChange: (value: string) => void;
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

export const ReportsFilterPanel: FC<ReportsFilterPanelProps> = ({
    reportId,
    onReportIdChange,
    customer,
    onCustomerChange,
    invoiceNumber,
    onInvoiceNumberChange,
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
    <div className="operational-header">
        <div>
            <p className="eyebrow">Reports</p>
            <h1>Business reports</h1>
            <p>Search the complete record history, then export or print exactly what matches.</p>
        </div>
        <SearchableDropdown
            label="Report"
            onChange={onReportIdChange}
            options={[
                { value: 'sales-register', label: 'Sales register' },
                { value: 'tax-summary', label: 'Tax summary' },
                { value: 'customer-ledger', label: 'Customer ledger' },
            ]}
            value={reportId}
        />
        <section className="data-panel">
            <div className="report-filter-grid">
                <label>
                    <span>Customer</span>
                    <input
                        list="report-customers"
                        placeholder="Any customer"
                        value={customer}
                        onChange={(event) => {
                            onCustomerChange(event.currentTarget.value);
                        }}
                    />
                    <datalist id="report-customers">
                        {customers.map((name) => (
                            <option key={name} value={name} />
                        ))}
                    </datalist>
                </label>
                <label>
                    <span>Invoice number</span>
                    <input
                        placeholder="Full or partial number"
                        value={invoiceNumber}
                        onChange={(event) => {
                            onInvoiceNumberChange(event.currentTarget.value);
                        }}
                    />
                </label>
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
                    label="Quick range"
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
    </div>
);
