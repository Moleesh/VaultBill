/** @format */

import { escapePrintHtml } from '../records/RecordPrintHtmlSupport';
import type { AppRecord } from '../records/RecordStoreSupport';

/**
 * Builds the CSV payload for the selected report view.
 */
export const buildReportCsv = (reportId: string, records: readonly AppRecord[]): string => {
    let rows: readonly (readonly string[])[];
    if (reportId === 'tax-summary') {
        rows = [
            ['Tax rate', 'Taxable value', 'Tax amount', 'Finalized lines'],
            ...buildTaxSummary(records).map((row) => [
                row.rate,
                row.taxable.toFixed(2),
                row.tax.toFixed(2),
                String(row.count),
            ]),
        ];
    } else if (reportId === 'customer-ledger') {
        rows = [
            [
                'Customer name',
                'GSTIN',
                'Latest record date',
                'Record count',
                'Cancelled',
                'Finalized revenue',
            ],
            ...buildCustomerLedger(records).map((row) => [
                row.customer,
                row.gstin,
                row.latestDate,
                String(row.documents),
                String(row.cancelled),
                row.revenue.toFixed(2),
            ]),
        ];
    } else {
        rows = [
            ['Record number', 'Date', 'Customer name', 'GSTIN', 'Status', 'Amount'],
            ...records.map((record) => [
                record.documentNumber ?? '',
                record.invoiceDate,
                record.customerName,
                record.gstin,
                record.status,
                record.grandTotal,
            ]),
        ];
    }
    return rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
};

/**
 * Produces a printable HTML report for the selected report view.
 */
export const renderReportHtml = (reportId: string, records: readonly AppRecord[]): string => `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${escapePrintHtml(reportId)}</title>
    <style>
      body { font-family: 'Trebuchet MS', 'Candara', 'Segoe UI', sans-serif; margin: 32px; color: #102f2b; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border-bottom: 1px solid #c7d9d5; padding: 8px; text-align: left; }
      th:last-child, td:last-child { text-align: right; }
    </style>
  </head>
  <body>
    <h1>${escapePrintHtml(reportId.replaceAll('-', ' '))}</h1>
    <p>${records.length.toLocaleString()} matching records</p>
    ${renderReportTable(reportId, records)}
  </body>
</html>`;

/**
 * Aggregates finalized records into a tax summary table.
 */
export const buildTaxSummary = (
    records: readonly AppRecord[],
): readonly { rate: string; taxable: number; tax: number; count: number }[] => {
    const summary = new Map<
        string,
        { rate: string; taxable: number; tax: number; count: number }
    >();
    for (const record of records.filter((item) => item.status === 'Finalized')) {
        for (const line of record.lineItems) {
            const rateNumber = Number.parseFloat(line.taxPercent) || 0;
            const gross = Number.parseFloat(line.amount) || 0;
            const taxable = rateNumber === 0 ? gross : gross / (1 + rateNumber / 100);
            const current = summary.get(line.taxPercent) ?? {
                rate: line.taxPercent,
                taxable: 0,
                tax: 0,
                count: 0,
            };
            current.taxable += taxable;
            current.tax += gross - taxable;
            current.count += 1;
            summary.set(line.taxPercent, current);
        }
    }
    return [...summary.values()].sort(
        (left, right) => Number.parseFloat(left.rate) - Number.parseFloat(right.rate),
    );
};

/**
 * Aggregates customer revenue and cancellation counts from the filtered record set.
 */
export const buildCustomerLedger = (
    records: readonly AppRecord[],
): readonly {
    customer: string;
    gstin: string;
    latestDate: string;
    documents: number;
    cancelled: number;
    revenue: number;
}[] => {
    const ledger = new Map<
        string,
        {
            customer: string;
            gstin: string;
            latestDate: string;
            documents: number;
            cancelled: number;
            revenue: number;
        }
    >();
    for (const record of records) {
        const key = `${record.customerName.toLocaleLowerCase()}:${record.gstin.toLocaleLowerCase()}`;
        const current = ledger.get(key) ?? {
            customer: record.customerName,
            gstin: record.gstin,
            latestDate: record.invoiceDate,
            documents: 0,
            cancelled: 0,
            revenue: 0,
        };
        current.documents += 1;
        current.latestDate =
            current.latestDate > record.invoiceDate ? current.latestDate : record.invoiceDate;
        if (record.status === 'Cancelled') current.cancelled += 1;
        if (record.status === 'Finalized')
            current.revenue += Number.parseFloat(record.grandTotal) || 0;
        ledger.set(key, current);
    }
    return [...ledger.values()].sort(
        (left, right) =>
            right.revenue - left.revenue || left.customer.localeCompare(right.customer),
    );
};

const escapeCsv = (value: string): string => `"${value.replaceAll('"', '""')}"`;

const renderReportTable = (reportId: string, records: readonly AppRecord[]): string => {
    if (reportId === 'tax-summary') {
        return `<table><thead><tr><th>Tax rate</th><th>Taxable value</th><th>Tax amount</th><th>Lines</th></tr></thead><tbody>${buildTaxSummary(
            records,
        )
            .map(
                (row) =>
                    `<tr><td>${escapePrintHtml(row.rate)}%</td><td>${row.taxable.toFixed(2)}</td><td>${row.tax.toFixed(2)}</td><td>${String(row.count)}</td></tr>`,
            )
            .join('')}</tbody></table>`;
    }
    if (reportId === 'customer-ledger') {
        return `<table><thead><tr><th>Customer name</th><th>GSTIN</th><th>Record count</th><th>Cancelled</th><th>Revenue</th></tr></thead><tbody>${buildCustomerLedger(
            records,
        )
            .map(
                (row) =>
                    `<tr><td>${escapePrintHtml(row.customer)}</td><td>${escapePrintHtml(row.gstin)}</td><td>${String(row.documents)}</td><td>${String(row.cancelled)}</td><td>${row.revenue.toFixed(2)}</td></tr>`,
            )
            .join('')}</tbody></table>`;
    }
    return `<table><thead><tr><th>Record number</th><th>Date</th><th>Customer name</th><th>Status</th><th>Amount</th></tr></thead><tbody>${records
        .map(
            (record) =>
                `<tr><td>${escapePrintHtml(record.documentNumber ?? 'Draft')}</td><td>${escapePrintHtml(record.invoiceDate)}</td><td>${escapePrintHtml(record.customerName)}</td><td>${record.status}</td><td>${record.status === 'Cancelled' ? 'Excluded' : escapePrintHtml(record.grandTotal)}</td></tr>`,
        )
        .join('')}</tbody></table>`;
};
