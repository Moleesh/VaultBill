import { describe, expect, it } from 'vitest';

import type { DocumentRecord } from '../../features/records/DocumentRecordSchema';
import type { PrintTemplateRecord } from './PrintTemplateTypes';
import { preparePrintJob } from './PrintWorkflow';

const sampleTemplate: PrintTemplateRecord = {
  templateId: 'TaxInvoiceA4',
  templateName: 'Tax Invoice A4',
  templateHtml:
    '<h1>{{Record.CustomerName}}</h1><p>{{Record.InvoiceNumber}}</p><section>{{Items}}</section>',
  scope: 'Record',
  updatedAt: '2026-06-04T10:00:00.000Z',
  templateConfig: {
    TemplateId: 'TaxInvoiceA4',
    TemplateName: 'Tax Invoice A4',
    Scope: 'Record',
    Mappings: {
      'Record.CustomerName': {
        SourceField: 'CustomerName',
        SampleValue: 'Sample Customer',
      },
      'Record.InvoiceNumber': {
        SourceField: 'DocumentNumber',
        SampleValue: 'TEST-0001',
      },
      Items: {
        SourceField: 'LineItemSections.Items',
        SampleValue: [
          {
            Values: { ItemName: 'Sample Item', Amount: '1000.00' },
          },
        ],
      },
    },
  },
};

const createRecord = (status: DocumentRecord['Status']): DocumentRecord => ({
  RecordId: 'Record_01',
  FormatId: 'TaxInvoice',
  FormatName: 'GST Invoice',
  DocumentNumber: status === 'Draft' ? null : 'TaxInvoice-000001',
  Status: status,
  Values: {
    CustomerName: 'Actual Customer',
  },
  LineItemSections: {
    Items: [
      {
        RowId: 'Row_01',
        DisplayOrder: 1,
        Values: { ItemName: 'Actual Item', Amount: '1180.00' },
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
});

describe('PrintWorkflow', () => {
  it('prepares Draft Print without allocating a document number', () => {
    const job = preparePrintJob({
      action: 'DraftPrint',
      outputTarget: 'PreviewOnly',
      platform: 'DesktopElectron',
      template: sampleTemplate,
      assets: [],
      record: createRecord('Draft'),
    });

    expect(job.html).toContain('Actual Customer');
    expect(job.html).not.toContain('TaxInvoice-000001');
    expect(job.outputPlan).toMatchObject({
      target: 'PreviewOnly',
      label: 'Preview',
      copyCount: 1,
    });
  });

  it('requires finalized records for Final Print', () => {
    expect(() =>
      preparePrintJob({
        action: 'FinalPrint',
        outputTarget: 'Printer',
        platform: 'DesktopElectron',
        template: sampleTemplate,
        assets: [],
        record: createRecord('Draft'),
      }),
    ).toThrow('Final Print requires a finalized record.');
  });

  it('allows Reprint for finalized and cancelled records only', () => {
    expect(
      preparePrintJob({
        action: 'Reprint',
        outputTarget: 'Printer',
        platform: 'DesktopElectron',
        template: sampleTemplate,
        assets: [],
        record: createRecord('Cancelled'),
      }).html,
    ).toContain('Actual Customer');

    expect(() =>
      preparePrintJob({
        action: 'Reprint',
        outputTarget: 'Printer',
        platform: 'DesktopElectron',
        template: sampleTemplate,
        assets: [],
        record: createRecord('Draft'),
      }),
    ).toThrow('Reprint requires a finalized or cancelled record.');
  });

  it('uses sample values for Test Print without requiring a record', () => {
    const job = preparePrintJob({
      action: 'TestPrint',
      outputTarget: 'DownloadPdf',
      platform: 'DesktopElectron',
      template: sampleTemplate,
      assets: [],
      requestedCopies: 9,
    });

    expect(job.html).toContain('Sample Customer');
    expect(job.html).toContain('TEST-0001');
    expect(job.outputPlan).toMatchObject({
      label: 'Download as PDF',
      copyCount: 1,
      pdfMode: 'DesktopGenerated',
    });
  });

  it('applies copy count only to printer output and warns for web PDF', () => {
    const printerJob = preparePrintJob({
      action: 'FinalPrint',
      outputTarget: 'Printer',
      platform: 'DesktopElectron',
      template: sampleTemplate,
      assets: [],
      record: createRecord('Finalized'),
      requestedCopies: 3,
    });
    const webPdfJob = preparePrintJob({
      action: 'FinalPrint',
      outputTarget: 'DownloadPdf',
      platform: 'Web',
      template: sampleTemplate,
      assets: [],
      record: createRecord('Finalized'),
      requestedCopies: 3,
    });

    expect(printerJob.outputPlan.copyCount).toBe(3);
    expect(webPdfJob.outputPlan).toMatchObject({
      label: 'Download as PDF',
      copyCount: 1,
      pdfMode: 'BrowserSaveAsPdf',
    });
    expect(webPdfJob.warnings[0]?.message).toContain('Save as PDF');
  });
});
