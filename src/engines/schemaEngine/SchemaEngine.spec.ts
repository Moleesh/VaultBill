/** @format */

import { describe, expect, it } from 'vitest';

import { builtInDefaultFormat } from '../../db/startup/BuiltInDefaultFormat';
import {
    detectBreakingChangeWarnings,
    getSavableFields,
    parseDocumentFormatConfig,
    validateDocumentValues,
    validateFieldValue,
} from './SchemaEngine';

describe('SchemaEngine', () => {
    it('parses a valid document format config', () => {
        expect(parseDocumentFormatConfig(JSON.stringify(builtInDefaultFormat))).toEqual(
            builtInDefaultFormat,
        );
    });

    it('excludes layout and generated fields from default saved fields', () => {
        const format = {
            ...builtInDefaultFormat,
            Fields: [
                ...builtInDefaultFormat.Fields,
                { FieldId: 'Spacer', Label: 'Spacer', Type: 'Blank' as const },
                { FieldId: 'Qr', Label: 'QR', Type: 'QRCode' as const },
            ],
        };

        const savableFieldIds = getSavableFields(format).map((field) => field.fieldId);

        expect(savableFieldIds).toContain('CustomerName');
        expect(savableFieldIds).not.toContain('Spacer');
        expect(savableFieldIds).not.toContain('Qr');
    });

    it('validates required fields and decimal strings', () => {
        expect(
            validateDocumentValues(builtInDefaultFormat, {
                InvoiceDate: '2026-06-04',
                CustomerName: '',
                GrandTotal: 1180,
            }),
        ).toEqual({
            isValid: false,
            issues: [
                { fieldId: 'CustomerName', message: 'Customer Name is required.' },
                { fieldId: 'GrandTotal', message: 'Grand Total must be a decimal string.' },
            ],
        });
    });

    it('validates character max length', () => {
        expect(
            validateFieldValue(
                {
                    FieldId: 'Code',
                    Label: 'Code',
                    Type: 'Character',
                    MaxLength: 3,
                },
                'ABCD',
            ),
        ).toEqual([{ fieldId: 'Code', message: 'Code must be 3 characters or fewer.' }]);
    });

    it('warns before format id changes or referenced field deletion', () => {
        const nextFormat = {
            ...builtInDefaultFormat,
            FormatId: 'NewTaxInvoice',
            Fields: builtInDefaultFormat.Fields.filter((field) => field.FieldId !== 'CustomerName'),
        };

        expect(
            detectBreakingChangeWarnings(builtInDefaultFormat, nextFormat, {
                reportReferences: { CustomerName: ['Sales Summary > Customer'] },
                printReferences: { CustomerName: ['Invoice A4 > Customer'] },
            }),
        ).toEqual([
            {
                kind: 'FormatIdChanged',
                message: 'Changing FormatId is a breaking change.',
                affectedReferences: [],
            },
            {
                kind: 'FieldRemovedWithReferences',
                message: 'Customer Name cannot be deleted without reviewing dependent references.',
                affectedReferences: ['Sales Summary > Customer', 'Invoice A4 > Customer'],
            },
        ]);
    });
});
