/** @format */

import { describe, expect, it } from 'vitest';

import { builtInDefaultFormat } from '../../db/startup/BuiltInDefaultFormat';
import { parseDelimitedText } from './DelimitedTextParser';
import { buildImportPreview } from './ImportPreviewEngine';

const rowIdFactory = (rowNumber: number) => `Row_${rowNumber.toString()}`;

describe('ImportPreviewEngine', () => {
    it('detects headers, proposes mappings, validates, and calculates line items', () => {
        const preview = buildImportPreview({
            scope: {
                kind: 'LineItem',
                format: builtInDefaultFormat,
                sectionId: 'Items',
            },
            sourceTable: parseDelimitedText('Item Name,Quantity,Rate\nSample Item,2.000,500.0000'),
            calculateDerived: true,
            rowIdFactory,
        });

        expect(preview.proposedMapping).toMatchObject({
            ItemName: 0,
            Quantity: 1,
            Rate: 2,
        });
        expect(preview.rows[0]?.values).toMatchObject({
            ItemName: 'Sample Item',
            Quantity: '2.000',
            Rate: '500.0000',
            Amount: '1000.00',
        });
        expect(preview.validRows).toBe(1);
        expect(preview.invalidRows).toBe(0);
    });

    it('supports manual mapping and highlights invalid row-level values', () => {
        const preview = buildImportPreview({
            scope: {
                kind: 'LineItem',
                format: builtInDefaultFormat,
                sectionId: 'Items',
            },
            sourceTable: parseDelimitedText('2.000,500.0000'),
            mapping: { Quantity: 0, Rate: 1 },
            calculateDerived: false,
            rowIdFactory,
        });

        expect(preview.rows[0]?.issues).toEqual([
            {
                rowNumber: 1,
                fieldId: 'ItemName',
                message: 'Item Name is required.',
            },
        ]);
        expect(preview.rows[0]?.warnings).toContainEqual({
            rowNumber: 1,
            fieldId: 'ItemName',
            message: 'Item Name is not mapped.',
        });
    });

    it('reports duplicate external document numbers in full-record preview', () => {
        const preview = buildImportPreview({
            scope: { kind: 'TopLevel', format: builtInDefaultFormat },
            sourceTable: parseDelimitedText(
                'External Document Number,Invoice Date,Customer Name\nEXT-1,2026-06-04,A\nEXT-1,2026-06-05,B',
            ),
            calculateDerived: false,
            rowIdFactory,
        });

        expect(preview.invalidRows).toBe(2);
        expect(preview.rows[0]?.issues).toContainEqual({
            rowNumber: 1,
            fieldId: 'ExternalDocumentNumber',
            message: 'External document number EXT-1 is duplicated.',
        });
    });
});
