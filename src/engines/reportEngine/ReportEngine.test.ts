import { describe, expect, it } from 'vitest';

import type { DocumentRecord } from '../../features/records/DocumentRecordSchema';
import { buildAllReportRows, getReportPage } from './ReportEngine';
import { buildCsvReportExport } from './ReportExport';
import { prepareReportPrint } from './ReportPrintEngine';
import type { ReportConfig } from './ReportTypes';
import type { PrintTemplateRecord } from '../printEngine/PrintTemplateTypes';

const report: ReportConfig = {
  ReportId: 'SalesSummary',
  ReportName: 'Sales Summary',
  Source: 'Records',
  FormatIds: ['TaxInvoice'],
  Filters: [
    {
      FieldId: 'InvoiceDate',
      Type: 'DateRange',
      Label: 'Invoice Date',
    },
  ],
  Columns: [
    {
      ColumnId: 'InvoiceNumber',
      Label: 'Invoice No.',
      SourceField: 'DocumentNumber',
    },
    {
      ColumnId: 'CustomerName',
      Label: 'Customer',
      SourceField: 'CustomerName',
    },
    {
      ColumnId: 'GrandTotal',
      Label: 'Total',
      SourceField: 'GrandTotal',
      Format: 'Currency',
    },
  ],
  PrintTemplates: [{ TemplateId: 'SalesSummaryA4', IsDefault: true }],
};

const createRecord = (
  id: string,
  createdAt: string,
  invoiceDate: string,
  customerName: string,
): DocumentRecord => ({
  RecordId: id,
  FormatId: 'TaxInvoice',
  FormatName: 'GST Invoice',
  DocumentNumber: id.replace('Record', 'INV'),
  Status: 'Finalized',
  Values: {
    InvoiceDate: invoiceDate,
    CustomerName: customerName,
    GrandTotal: '1180.00',
  },
  LineItemSections: {},
  Attachments: [],
  CreatedAt: createdAt,
  CreatedBy: 'user_1',
  CreatedByName: 'Counter Operator',
  LastActionAt: createdAt,
  LastActionBy: 'user_1',
  LastActionByName: 'Counter Operator',
});

const printTemplate: PrintTemplateRecord = {
  templateId: 'SalesSummaryA4',
  templateName: 'Sales Summary A4',
  templateHtml: '<h1>{{Report.Name}}</h1>{{Report.Table}}',
  scope: 'Report',
  updatedAt: '2026-06-04T10:00:00.000Z',
  templateConfig: {
    TemplateId: 'SalesSummaryA4',
    TemplateName: 'Sales Summary A4',
    Scope: 'Report',
    Mappings: {
      'Report.Name': { SourceField: 'ReportName' },
      'Report.Table': { SourceField: 'Rows' },
    },
  },
};

describe('ReportEngine', () => {
  it('filters records and pages latest-created-first for infinite scroll', () => {
    const records = [
      createRecord('Record_1', '2026-06-04T10:00:00.000Z', '2026-06-04', 'A'),
      createRecord('Record_2', '2026-06-05T10:00:00.000Z', '2026-06-05', 'B'),
      createRecord('Record_3', '2026-06-06T10:00:00.000Z', '2026-06-06', 'C'),
    ];
    const firstPage = getReportPage(
      records,
      report,
      { InvoiceDate: { from: '2026-06-05', to: '2026-06-06' } },
      1,
    );

    expect(firstPage.rows[0]?.recordId).toBe('Record_3');
    expect(firstPage.nextCursor).toBe(1);
    expect(firstPage.isComplete).toBe(false);
    expect(
      getReportPage(records, report, { InvoiceDate: { from: '2026-06-05' } }, 5)
        .totalMatchingRows,
    ).toBe(2);
  });

  it('exports all matching rows with spreadsheet formula protection', () => {
    const rows = buildAllReportRows(
      [
        createRecord('Record_1', '2026-06-04T10:00:00.000Z', '2026-06-04', '=Bad'),
        createRecord('Record_2', '2026-06-05T10:00:00.000Z', '2026-06-05', 'Good'),
      ],
      report,
      {},
    );

    expect(rows).toHaveLength(2);
    expect(buildCsvReportExport(report, rows)).toContain('"\'=Bad"');
  });

  it('prints all report rows through safe table HTML', () => {
    const rows = buildAllReportRows(
      [createRecord('Record_1', '2026-06-04T10:00:00.000Z', '2026-06-04', '<Unsafe>')],
      report,
      {},
    );
    const printed = prepareReportPrint({
      report,
      rows,
      template: printTemplate,
      assets: [],
    });

    expect(printed.html).toContain('<table>');
    expect(printed.html).toContain('&lt;Unsafe&gt;');
    expect(printed.html).not.toContain('<Unsafe>');
  });
});
