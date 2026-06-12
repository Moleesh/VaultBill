/** @format */

import { describe, expect, it } from 'vitest';

import { builtInDefaultFormat } from '../../../db/startup/BuiltInDefaultFormat';
import {
    addLineItemRow,
    createInitialLineItemRows,
    duplicateLineItemRow,
    getEssentialLineItemFields,
    reorderLineItemRows,
    validateLineItemRows,
} from '../LineItemEngine';

const itemsSection = builtInDefaultFormat.LineItemSections[0];

const requireItemsSection = () => {
    if (!itemsSection) {
        throw new Error('Expected built-in Items section.');
    }

    return itemsSection;
};

const rowIdFactory = () => {
    let nextId = 1;

    return () => {
        const rowId = `Row_${nextId.toString()}`;
        nextId += 1;
        return rowId;
    };
};

describe('LineItemEngine', () => {
    it('creates minimum rows with display order and default values', () => {
        const rows = createInitialLineItemRows(requireItemsSection(), rowIdFactory());

        expect(rows).toEqual([
            {
                RowId: 'Row_1',
                DisplayOrder: 1,
                Values: { Quantity: '1.000' },
            },
        ]);
    });

    it('adds and duplicates rows while preserving row identity rules', () => {
        const createRowId = rowIdFactory();
        const rows = createInitialLineItemRows(requireItemsSection(), createRowId);
        const addedRows = addLineItemRow(requireItemsSection(), rows, createRowId, {
            Values: { ItemName: 'Sample', Quantity: '2.000' },
        });
        const duplicatedRows = duplicateLineItemRow(
            requireItemsSection(),
            addedRows,
            'Row_2',
            createRowId,
        );

        expect(duplicatedRows).toHaveLength(3);
        expect(duplicatedRows[2]).toEqual({
            RowId: 'Row_3',
            DisplayOrder: 3,
            Values: { Quantity: '2.000', ItemName: 'Sample' },
        });
    });

    it('reorders rows and rewrites display order', () => {
        const createRowId = rowIdFactory();
        const rows = addLineItemRow(
            requireItemsSection(),
            createInitialLineItemRows(requireItemsSection(), createRowId),
            createRowId,
        );

        expect(reorderLineItemRows(requireItemsSection(), rows, ['Row_2', 'Row_1'])).toEqual([
            { RowId: 'Row_2', DisplayOrder: 1, Values: { Quantity: '1.000' } },
            { RowId: 'Row_1', DisplayOrder: 2, Values: { Quantity: '1.000' } },
        ]);
    });

    it('returns essential grid fields in configured order', () => {
        expect(
            getEssentialLineItemFields(requireItemsSection()).map((field) => field.FieldId),
        ).toEqual(['ItemName', 'Quantity', 'Rate', 'Amount']);
    });

    it('validates row values and skips missing calculated fields', () => {
        expect(
            validateLineItemRows(requireItemsSection(), [
                {
                    RowId: 'Row_1',
                    DisplayOrder: 1,
                    Values: { Quantity: 2, Rate: '500.0000' },
                },
            ]),
        ).toEqual([
            {
                rowId: 'Row_1',
                displayOrder: 1,
                fieldId: 'ItemName',
                message: 'Item Name is required.',
            },
            {
                rowId: 'Row_1',
                displayOrder: 1,
                fieldId: 'Quantity',
                message: 'Quantity must be a decimal string.',
            },
        ]);
    });

    it('rejects add operations when max rows would be exceeded', () => {
        const section = { ...requireItemsSection(), MaxRows: 1 };
        const rows = createInitialLineItemRows(section, rowIdFactory());

        expect(() => addLineItemRow(section, rows, rowIdFactory())).toThrow(/at most 1 rows/u);
    });
});
