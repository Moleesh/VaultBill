/** @format */

import { getImportFields } from './ImportFieldCatalog';
import type { ImportScope, TemplateColumn } from './ImportTypes';
import { escapeSpreadsheetFormula } from './SpreadsheetSafety';

export const buildImportTemplateColumns = (scope: ImportScope): readonly TemplateColumn[] =>
    getImportFields(scope).map((field) => ({
        label: field.label,
        fieldId: field.fieldId,
        required: field.kind,
        dataType: field.type,
        example: escapeSpreadsheetFormula(formatSampleValue(field.sampleValue)),
        calculated: field.kind === 'AutoCalculated' ? 'Yes' : 'No',
    }));

const formatSampleValue = (value: unknown): string => {
    if (value === undefined || value === null) {
        return '';
    }

    if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'bigint' ||
        typeof value === 'boolean'
    ) {
        return value.toString();
    }

    return JSON.stringify(value);
};
