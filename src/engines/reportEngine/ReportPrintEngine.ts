import { escapeHtml } from '../printEngine/HtmlEscape';
import { compilePrintTemplate } from '../printEngine/TemplatePlaceholderCompiler';
import type {
  PrintCompileWarning,
  PrintTemplateAsset,
  PrintTemplateRecord,
} from '../printEngine/PrintTemplateTypes';
import type { ReportConfig, ReportRow } from './ReportTypes';

export type PrepareReportPrintInput = {
  readonly report: ReportConfig;
  readonly rows: readonly ReportRow[];
  readonly template: PrintTemplateRecord;
  readonly assets: readonly PrintTemplateAsset[];
};

export type PreparedReportPrint = {
  readonly html: string;
  readonly warnings: readonly PrintCompileWarning[];
};

const reportTableToken = '__VAULTBILL_REPORT_TABLE__';

export const prepareReportPrint = (input: PrepareReportPrintInput): PreparedReportPrint => {
  const compiled = compilePrintTemplate({
    templateHtml: input.template.templateHtml,
    values: {
      'Report.Name': input.report.ReportName,
      'Report.Table': reportTableToken,
    },
    assets: input.assets,
  });

  return {
    html: compiled.html.replaceAll(reportTableToken, renderReportTable(input.report, input.rows)),
    warnings: compiled.warnings,
  };
};

const renderReportTable = (report: ReportConfig, rows: readonly ReportRow[]): string => {
  const header = report.Columns.map((column) => `<th>${escapeHtml(column.Label)}</th>`).join('');
  const body = rows.map((row) => renderReportTableRow(report, row)).join('');

  return `<table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
};

const renderReportTableRow = (report: ReportConfig, row: ReportRow): string => {
  const cells = report.Columns.map(
    (column) => `<td>${escapeHtml(row.values[column.ColumnId] ?? '')}</td>`,
  ).join('');

  return `<tr>${cells}</tr>`;
};
