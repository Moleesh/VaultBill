/** @format */

import { escapeSpreadsheetFormula } from '../importEngine/SpreadsheetSafety';
import type { ReportConfig, ReportRow } from './ReportTypes';

export const buildCsvReportExport = (report: ReportConfig, rows: readonly ReportRow[]): string => {
    const header = report.Columns.map((column) => quoteCsv(column.Label)).join(',');
    const body = rows.map((row) =>
        report.Columns.map((column) => quoteCsv(row.values[column.ColumnId] ?? '')).join(','),
    );

    return [header, ...body].join('\n');
};

const quoteCsv = (value: string): string => {
    const safeValue = escapeSpreadsheetFormula(value);
    return `"${safeValue.replaceAll('"', '""')}"`;
};
