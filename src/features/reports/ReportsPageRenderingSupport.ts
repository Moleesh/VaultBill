/** @format */

import { escapePrintHtml } from '../records/RecordPrintHtmlSupport';
import type { AppRecord } from '../records/RecordStoreSupport';
import { buildReportTableModel } from './ReportsPageTableModel';

const escapeCsv = (value: string): string => `"${value.replaceAll('"', '""')}"`;

/**
 * Builds the CSV payload for the selected report view.
 */
export const buildReportCsv = (
    reportId: string,
    records: readonly AppRecord[],
    displayFields: readonly string[],
): string => {
    const table = buildReportTableModel(reportId, records, displayFields);
    const rows = [table.columns.map((column) => column.label), ...table.rows];
    return rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
};

/**
 * Produces a printable HTML report for the selected report view.
 */
export const renderReportHtml = (
    reportId: string,
    records: readonly AppRecord[],
    displayFields: readonly string[],
): string => `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${escapePrintHtml(reportId)}</title>
    <style>
      body { font-family: 'Trebuchet MS', 'Candara', 'Segoe UI', sans-serif; margin: 32px; color: #102f2b; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border-bottom: 1px solid #c7d9d5; padding: 8px; text-align: left; }
      .numeric-cell { text-align: right; }
    </style>
  </head>
  <body>
    <h1>${escapePrintHtml(reportId.replaceAll('-', ' '))}</h1>
    <p>${records.length.toLocaleString()} matching records</p>
    ${renderReportTable(reportId, records, displayFields)}
  </body>
</html>`;

const renderReportTable = (
    reportId: string,
    records: readonly AppRecord[],
    displayFields: readonly string[],
): string => {
    const table = buildReportTableModel(reportId, records, displayFields);
    return `<table><thead><tr>${table.columns
        .map(
            (column) =>
                `<th${column.align === 'right' ? ' class="numeric-cell"' : ''}>${escapePrintHtml(column.label)}</th>`,
        )
        .join('')}</tr></thead><tbody>${table.rows
        .map(
            (row) =>
                `<tr>${row
                    .map(
                        (value, index) =>
                            `<td${table.columns[index]?.align === 'right' ? ' class="numeric-cell"' : ''}>${escapePrintHtml(value)}</td>`,
                    )
                    .join('')}</tr>`,
        )
        .join('')}</tbody></table>`;
};

export { buildCustomerLedger, buildTaxSummary } from './ReportsPageTableModel';
