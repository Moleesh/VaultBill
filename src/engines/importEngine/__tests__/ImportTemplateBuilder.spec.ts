/** @format */

import { describe, expect, it } from 'vitest';

import { builtInDefaultFormat } from '../../../db/startup/BuiltInDefaultFormat';
import { buildImportTemplateColumns } from '../ImportTemplateBuilder';
import { escapeSpreadsheetFormula } from '../SpreadsheetSafety';

describe('ImportTemplateBuilder', () => {
    it('generates line-item template columns with required and calculated markers', () => {
        const columns = buildImportTemplateColumns({
            kind: 'LineItem',
            format: builtInDefaultFormat,
            sectionId: 'Items',
        });

        expect(columns).toContainEqual({
            label: 'Item Name',
            fieldId: 'ItemName',
            required: 'Required',
            dataType: 'Text',
            example: 'Sample Item',
            calculated: 'No',
        });
        expect(columns).toContainEqual({
            label: 'Amount',
            fieldId: 'Amount',
            required: 'AutoCalculated',
            dataType: 'Money',
            example: '1000.00',
            calculated: 'Yes',
        });
    });

    it('escapes spreadsheet formula injection in generated template examples', () => {
        expect(escapeSpreadsheetFormula('=SUM(A1:A2)')).toBe("'=SUM(A1:A2)");
        expect(escapeSpreadsheetFormula('@cmd')).toBe("'@cmd");
        expect(escapeSpreadsheetFormula('Safe value')).toBe('Safe value');
    });
});
