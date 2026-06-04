import { describe, expect, it } from 'vitest';

import type { DocumentRecord } from '../../features/records/DocumentRecordSchema';
import { buildRecordPrintValues } from './PrintValueMapper';
import type { PrintTemplateConfig } from './PrintTemplateTypes';

const sampleRecord: DocumentRecord = {
  RecordId: 'Record_01',
  FormatId: 'TaxInvoice',
  FormatName: 'GST Invoice',
  DocumentNumber: 'TaxInvoice-000001',
  Status: 'Finalized',
  Values: {
    CustomerName: 'Sample Customer',
    GrandTotal: '1180.00',
  },
  LineItemSections: {
    Items: [
      {
        RowId: 'Row_01',
        DisplayOrder: 1,
        Values: { ItemName: 'Sample Item' },
      },
    ],
  },
  Attachments: [],
  CreatedAt: '2026-06-04T10:00:00.000Z',
  CreatedBy: 'user_1',
  CreatedByName: 'Counter Operator',
  LastActionAt: '2026-06-04T10:05:00.000Z',
  LastActionBy: 'user_1',
  LastActionByName: 'Counter Operator',
};

const templateConfig: PrintTemplateConfig = {
  TemplateId: 'TaxInvoiceA4',
  TemplateName: 'Tax Invoice A4',
  Scope: 'Record',
  Mappings: {
    'Record.CustomerName': { SourceField: 'CustomerName' },
    'Record.InvoiceNumber': { SourceField: 'DocumentNumber' },
    'Company.Name': { SourceField: 'Company.Name' },
    Items: { SourceField: 'LineItemSections.Items' },
    'Record.Missing': { SourceField: 'Missing' },
  },
};

describe('PrintValueMapper', () => {
  it('maps record metadata, values, company profile, and line-item sections', () => {
    const result = buildRecordPrintValues({
      record: sampleRecord,
      templateConfig,
      companyProfile: { Name: 'Sample Traders' },
    });

    expect(result.values).toMatchObject({
      'Record.CustomerName': 'Sample Customer',
      'Record.InvoiceNumber': 'TaxInvoice-000001',
      'Company.Name': 'Sample Traders',
      Items: sampleRecord.LineItemSections.Items,
    });
    expect(result.warnings).toEqual([
      {
        kind: 'MissingPlaceholder',
        placeholder: 'Record.Missing',
        message: 'Record.Missing mapping has no source value.',
      },
    ]);
  });
});
