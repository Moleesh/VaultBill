/** @format */

import { describe, expect, it } from 'vitest';

import type { DocumentRecord } from '../../../features/records/DocumentRecordSchema';
import type { PrinterProfileConfig } from '../PrinterProfileTypes';
import type { PrintTemplateRecord } from '../PrintTemplateTypes';
import { preparePrintJobFromProfile } from '../PrintProfileWorkflow';

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

const record: DocumentRecord = {
    RecordId: 'Record_01',
    FormatId: 'TaxInvoice',
    FormatName: 'GST Invoice',
    DocumentNumber: 'TaxInvoice-000001',
    Status: 'Finalized',
    Values: { CustomerName: 'Sample Customer' },
    LineItemSections: {},
    Attachments: [],
    CreatedAt: '2026-06-04T10:00:00.000Z',
    CreatedBy: 'user_1',
    CreatedByName: 'Counter Operator',
    LastActionAt: '2026-06-04T10:05:00.000Z',
    LastActionBy: 'user_1',
    LastActionByName: 'Counter Operator',
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

describe('PrintProfileWorkflow', () => {
    it('prepares a print job from an enabled selected-printer profile', () => {
        const job = preparePrintJobFromProfile({
            action: 'FinalPrint',
            platform: 'DesktopElectron',
            template,
            assets: [],
            record,
            printerProfile: profile,
            availablePrinters: [{ id: 'hp', name: 'HP LaserJet Pro', isDefault: false }],
        });

        expect(job.outputPlan).toMatchObject({
            target: 'Printer',
            copyCount: 2,
            printerName: 'HP LaserJet Pro',
        });
    });

    it('rejects disabled profile targets with their tooltip message', () => {
        expect(() => {
            preparePrintJobFromProfile({
                action: 'FinalPrint',
                platform: 'Web',
                template,
                assets: [],
                record,
                printerProfile: profile,
                availablePrinters: [],
            });
        }).toThrow('Selected printer output is available only on desktop.');
    });
});
