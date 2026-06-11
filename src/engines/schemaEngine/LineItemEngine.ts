/** @format */

import type { FieldConfig } from './SchemaEngineTypes';
import type {
    LineItemRow,
    LineItemRowDraft,
    LineItemSectionConfig,
    LineItemValidationIssue,
    RowIdFactory,
} from './LineItemTypes';
import { validateFieldValue } from './SchemaEngine';

export const createInitialLineItemRows = (
    section: LineItemSectionConfig,
    createRowId: RowIdFactory,
): readonly LineItemRow[] =>
    Array.from({ length: section.MinRows }, (_unused, index) =>
        createLineItemRow(section, createRowId, index + 1),
    );

export const addLineItemRow = (
    section: LineItemSectionConfig,
    rows: readonly LineItemRow[],
    createRowId: RowIdFactory,
    draft: LineItemRowDraft = {},
): readonly LineItemRow[] => {
    if (!section.AllowAddRows) {
        throw new Error(`${section.Label} does not allow adding rows.`);
    }

    assertBelowMaxRows(section, rows.length + 1);

    return [...rows, createLineItemRow(section, createRowId, rows.length + 1, draft.Values)];
};

export const duplicateLineItemRow = (
    section: LineItemSectionConfig,
    rows: readonly LineItemRow[],
    rowId: string,
    createRowId: RowIdFactory,
): readonly LineItemRow[] => {
    if (!section.AllowDuplicateRows) {
        throw new Error(`${section.Label} does not allow duplicate rows.`);
    }

    assertBelowMaxRows(section, rows.length + 1);

    const sourceRow = rows.find((row) => row.RowId === rowId);

    if (!sourceRow) {
        throw new Error(`Line item row ${rowId} was not found.`);
    }

    return [
        ...rows,
        {
            RowId: createRowId(),
            DisplayOrder: rows.length + 1,
            Values: { ...sourceRow.Values },
        },
    ];
};

export const reorderLineItemRows = (
    section: LineItemSectionConfig,
    rows: readonly LineItemRow[],
    orderedRowIds: readonly string[],
): readonly LineItemRow[] => {
    if (!section.AllowReorderRows) {
        throw new Error(`${section.Label} does not allow row reordering.`);
    }

    const rowById = new Map(rows.map((row) => [row.RowId, row]));

    if (orderedRowIds.length !== rows.length) {
        throw new Error('Reorder input must include every row exactly once.');
    }

    return orderedRowIds.map((rowId, index) => {
        const row = rowById.get(rowId);

        if (!row) {
            throw new Error(`Line item row ${rowId} was not found.`);
        }

        return {
            ...row,
            DisplayOrder: index + 1,
        };
    });
};

export const validateLineItemRows = (
    section: LineItemSectionConfig,
    rows: readonly LineItemRow[],
): readonly LineItemValidationIssue[] => [
    ...validateRowCount(section, rows),
    ...rows.flatMap((row) => validateLineItemRow(section, row)),
];

export const getEssentialLineItemFields = (
    section: LineItemSectionConfig,
): readonly FieldConfig[] =>
    section.EssentialColumns.flatMap((fieldId) => {
        const field = section.Fields.find((candidate) => candidate.FieldId === fieldId);
        return field ? [field] : [];
    });

const createLineItemRow = (
    section: LineItemSectionConfig,
    createRowId: RowIdFactory,
    displayOrder: number,
    values: Readonly<Record<string, unknown>> = {},
): LineItemRow => ({
    RowId: createRowId(),
    DisplayOrder: displayOrder,
    Values: {
        ...getDefaultValues(section),
        ...values,
    },
});

const getDefaultValues = (section: LineItemSectionConfig): Readonly<Record<string, unknown>> =>
    Object.fromEntries(
        section.Fields.flatMap((field) =>
            field.DefaultValue === undefined ? [] : [[field.FieldId, field.DefaultValue]],
        ),
    );

const validateRowCount = (
    section: LineItemSectionConfig,
    rows: readonly LineItemRow[],
): readonly LineItemValidationIssue[] => {
    if (rows.length < section.MinRows) {
        return [
            {
                rowId: '',
                displayOrder: 0,
                fieldId: section.SectionId,
                message: `${section.Label} requires at least ${section.MinRows.toString()} row(s).`,
            },
        ];
    }

    if (rows.length > section.MaxRows) {
        return [
            {
                rowId: '',
                displayOrder: 0,
                fieldId: section.SectionId,
                message: `${section.Label} allows at most ${section.MaxRows.toString()} row(s).`,
            },
        ];
    }

    return [];
};

const validateLineItemRow = (
    section: LineItemSectionConfig,
    row: LineItemRow,
): readonly LineItemValidationIssue[] =>
    section.Fields.flatMap((field) =>
        field.Calculated && row.Values[field.FieldId] === undefined
            ? []
            : validateFieldValue(field, row.Values[field.FieldId]).map((issue) => ({
                  ...issue,
                  rowId: row.RowId,
                  displayOrder: row.DisplayOrder,
              })),
    );

const assertBelowMaxRows = (section: LineItemSectionConfig, nextCount: number) => {
    if (nextCount > section.MaxRows) {
        throw new Error(`${section.Label} allows at most ${section.MaxRows.toString()} rows.`);
    }
};
