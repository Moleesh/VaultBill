/** @format */

import { describe, expect, it } from 'vitest';

import {
    formatPlacementLabel,
    groupDocumentFieldsByPlacement,
    groupLineFieldsByPlacement,
    normalizeFieldPlacement,
    withNormalizedFieldPlacements,
} from '../BuilderFieldPlacementSupport';
import { cloneDefault } from '../BuilderPageSupport';

describe('BuilderFieldPlacementSupport', () => {
    it('maps legacy document and line fields into safe placements', () => {
        const config = {
            ...cloneDefault(),
            Fields: [
                { FieldId: 'CustomerName', Label: 'Customer', Type: 'Text' },
                { FieldId: 'GrandTotal', Label: 'Grand total', Type: 'Money' },
                {
                    FieldId: 'InternalNote',
                    Label: 'Internal note',
                    Type: 'Text',
                    Visible: false,
                },
            ],
            LineItemSections: [
                {
                    ...cloneDefault().LineItemSections[0],
                    Fields: [
                        { FieldId: 'ItemName', Label: 'Item', Type: 'Text' },
                        { FieldId: 'ItemNote', Label: 'Note', Type: 'Textarea' },
                    ],
                },
            ],
        };

        const normalized = withNormalizedFieldPlacements(config as never);
        const documentGroups = groupDocumentFieldsByPlacement(normalized.Fields);
        const lineGroups = groupLineFieldsByPlacement(normalized.LineItemSections[0]?.Fields ?? []);

        expect(documentGroups.formFields.map((field) => field.FieldId)).toEqual(['CustomerName']);
        expect(documentGroups.summaryFields.map((field) => field.FieldId)).toEqual(['GrandTotal']);
        expect(documentGroups.hiddenFields.map((field) => field.FieldId)).toEqual(['InternalNote']);
        expect(lineGroups.lineItemColumns.map((field) => field.FieldId)).toEqual(['ItemName']);
        expect(lineGroups.lineItemDetails.map((field) => field.FieldId)).toEqual(['ItemNote']);
    });

    it('respects explicit placements and formats readable labels', () => {
        expect(
            normalizeFieldPlacement(
                {
                    DisplayPlacement: 'LineItemDetail',
                    FieldId: 'LineTaxCode',
                    Label: 'Tax code',
                    Type: 'Dropdown',
                } as never,
                'line',
            ),
        ).toBe('LineItemDetail');
        expect(formatPlacementLabel('Summary')).toBe('Summary total');
    });
});
