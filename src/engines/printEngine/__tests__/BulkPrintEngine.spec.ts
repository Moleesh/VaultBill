/** @format */

import { describe, expect, it } from 'vitest';

import type { DocumentRecord } from '../../../features/records/DocumentRecordSchema';
import { getBulkPrintProgress, prepareBulkPrint } from '../BulkPrintEngine';
import type { PrinterProfileConfig } from '../PrinterProfileTypes';
import type { PrintTemplateRecord } from '../PrintTemplateTypes';

const template: PrintTemplateRecord = {
    templateId: 'TaxInvoiceA4',
    templateName: 'Tax Invoice A4',
    templateHtml: '{{Record.CustomerName}}',
    scope: 'Record',
    updatedAt: '2026-06-04T10:00:00.000Z',
    templateConfig: {
        TemplateId: 'TaxInvoiceA4',
        TemplateName: 'Tax Invoice A4',
        Scope: 'Record',
        Mappings: {
            'Record.CustomerName': { SourceField: 'CustomerName' },
        },
    },
};

const profile: PrinterProfileConfig = {
    ProfileId: 'OfficeA4',
    ProfileName: 'Office A4 Printer',
    OutputTarget: 'SelectedPrinter',
    PrinterName: 'HP LaserJet Pro',
    PaperSize: 'A4',
    Orientation: 'Portrait',
    Margins: { Top: 10, Right: 10, Bottom: 10, Left: 10 },
    Scale: 1,
    ShowPreviewBeforePrint: false,
    AskCopiesBeforePrint: false,
    DefaultCopies: 2,
    FirstPageOnly: false,
};

const createRecord = (index: number): DocumentRecord => ({
    RecordId: `Record_${index.toString()}`,
    FormatId: 'TaxInvoice',
    FormatName: 'GST Invoice',
    DocumentNumber: `TaxInvoice-${index.toString().padStart(6, '0')}`,
    Status: 'Finalized',
    Values: { CustomerName: `Customer ${index.toString()}` },
    LineItemSections: {},
    Attachments: [],
    CreatedAt: '2026-06-04T10:00:00.000Z',
    CreatedBy: 'user_1',
    CreatedByName: 'Counter Operator',
    LastActionAt: '2026-06-04T10:05:00.000Z',
    LastActionBy: 'user_1',
    LastActionByName: 'Counter Operator',
});

describe('BulkPrintEngine', () => {
    it('prepares selected records as one combined PDF where supported', () => {
        const result = prepareBulkPrint({
            source: 'SelectedRecords',
            outputMode: 'CombinedPdf',
            action: 'FinalPrint',
            platform: 'DesktopElectron',
            records: [createRecord(1), createRecord(2)],
            template,
            assets: [],
            printerProfile: profile,
            availablePrinters: [],
        });

        expect(result.status).toBe('Ready');
        expect(result.totalRecords).toBe(2);
        expect(result.combinedHtml).toContain('Customer 1');
        expect(result.combinedHtml).toContain('page-break-after');
        expect(result.jobs[0]?.outputPlan).toMatchObject({
            target: 'DownloadPdf',
            copyCount: 1,
        });
    });

    it('prints each matching report record separately through the selected profile', () => {
        const result = prepareBulkPrint({
            source: 'FilteredReport',
            outputMode: 'PrinterEachDocument',
            action: 'Reprint',
            platform: 'DesktopElectron',
            records: [createRecord(1)],
            template,
            assets: [],
            printerProfile: profile,
            availablePrinters: [{ id: 'hp', name: 'HP LaserJet Pro', isDefault: false }],
        });

        expect(result.source).toBe('FilteredReport');
        expect(result.jobs[0]?.outputPlan).toMatchObject({
            target: 'Printer',
            copyCount: 2,
            printerName: 'HP LaserJet Pro',
        });
    });

    it('returns empty and progress states for long-running UI feedback', () => {
        const empty = prepareBulkPrint({
            source: 'SelectedRecords',
            outputMode: 'IndividualPdf',
            action: 'FinalPrint',
            platform: 'DesktopElectron',
            records: [],
            template,
            assets: [],
            printerProfile: profile,
            availablePrinters: [],
        });

        expect(empty).toMatchObject({
            status: 'Empty',
            warnings: ['No records match the bulk print request.'],
        });
        expect(getBulkPrintProgress(0, 0)).toEqual({
            completed: 0,
            total: 0,
            percent: 0,
            state: 'Idle',
        });
        expect(getBulkPrintProgress(2, 4)).toEqual({
            completed: 2,
            total: 4,
            percent: 50,
            state: 'Running',
        });
        expect(getBulkPrintProgress(5, 4)).toMatchObject({
            completed: 4,
            percent: 100,
            state: 'Complete',
        });
    });
});
