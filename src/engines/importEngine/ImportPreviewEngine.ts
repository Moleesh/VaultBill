import { calculateLineItemRows } from '../formulaEngine/FormulaEngine';
import type { LineItemRow } from '../schemaEngine/LineItemTypes';
import { validateLineItemRows } from '../schemaEngine/LineItemEngine';
import { validateDocumentValues } from '../schemaEngine/SchemaEngine';
import {
  findDuplicateExternalNumbers,
  getDuplicateExternalNumberIssue,
} from './ImportDuplicateChecks';
import { getLineItemSection } from './ImportFieldCatalog';
import { detectImportMapping } from './ImportMappingEngine';
import type {
  ImportMapping,
  ImportPreviewIssue,
  ImportPreviewResult,
  ImportScope,
  SourceTable,
} from './ImportTypes';
import { parseImportValue } from './ImportValueParser';

export type BuildImportPreviewInput = {
  readonly scope: ImportScope;
  readonly sourceTable: SourceTable;
  readonly mapping?: ImportMapping;
  readonly calculateDerived: boolean;
  readonly rowIdFactory: (rowNumber: number) => string;
};

export const buildImportPreview = (input: BuildImportPreviewInput): ImportPreviewResult => {
  const detection = detectImportMapping(input.scope, input.sourceTable);
  const mapping = input.mapping ?? detection.proposedMapping;
  const duplicateExternalNumbers = findDuplicateExternalNumbers(detection.dataRows, mapping);
  const rows = detection.dataRows.map((sourceRow, index) =>
    previewRow(input, sourceRow, index + 1, mapping, detection.fields, duplicateExternalNumbers),
  );

  return {
    fields: detection.fields,
    sourceColumns: detection.sourceColumns,
    proposedMapping: detection.proposedMapping,
    rows,
    validRows: rows.filter((row) => row.issues.length === 0).length,
    invalidRows: rows.filter((row) => row.issues.length > 0).length,
  };
};

const previewRow = (
  input: BuildImportPreviewInput,
  sourceRow: readonly string[],
  rowNumber: number,
  mapping: ImportMapping,
  fields: ImportPreviewResult['fields'],
  duplicateExternalNumbers: ReadonlySet<string>,
) => {
  const values = Object.fromEntries(
    fields.flatMap((field) => {
      if (!field.fieldConfig || field.kind === 'AutoCalculated') {
        return [];
      }

      const columnIndex = mapping[field.fieldId];
      const value = parseImportValue(field.fieldConfig, sourceRow[columnIndex ?? -1]);
      return value === undefined ? [] : [[field.fieldId, value]];
    }),
  );
  const calculatedValues = calculateDerivedValues(input, values, rowNumber);
  const issues = [
    ...validatePreviewValues(input, calculatedValues, rowNumber),
    ...getDuplicateExternalNumberIssue(mapping, rowNumber, duplicateExternalNumbers, sourceRow),
  ];
  const warnings = getPreviewWarnings(fields, mapping, rowNumber);

  return {
    rowNumber,
    values: calculatedValues,
    issues,
    warnings,
  };
};

const calculateDerivedValues = (
  input: BuildImportPreviewInput,
  values: Readonly<Record<string, unknown>>,
  rowNumber: number,
): Readonly<Record<string, unknown>> => {
  if (input.scope.kind !== 'LineItem' || !input.calculateDerived) {
    return values;
  }

  const section = getLineItemSection(input.scope.format, input.scope.sectionId);
  const rows = calculateLineItemRows(
    section,
    [{ RowId: input.rowIdFactory(rowNumber), DisplayOrder: rowNumber, Values: values }],
    input.scope.format.CalculationPolicy,
  );

  return rows[0]?.Values ?? values;
};

const validatePreviewValues = (
  input: BuildImportPreviewInput,
  values: Readonly<Record<string, unknown>>,
  rowNumber: number,
): readonly ImportPreviewIssue[] => {
  if (input.scope.kind === 'LineItem') {
    return validateLineItemPreview(input, values, rowNumber);
  }

  return validateDocumentValues(input.scope.format, values).issues.map((issue) => ({
    rowNumber,
    fieldId: issue.fieldId,
    message: issue.message,
  }));
};

const validateLineItemPreview = (
  input: BuildImportPreviewInput,
  values: Readonly<Record<string, unknown>>,
  rowNumber: number,
): readonly ImportPreviewIssue[] => {
  if (input.scope.kind !== 'LineItem') {
    return [];
  }

  const section = getLineItemSection(input.scope.format, input.scope.sectionId);
  const lineItemRow: LineItemRow = {
    RowId: input.rowIdFactory(rowNumber),
    DisplayOrder: rowNumber,
    Values: values,
  };

  return validateLineItemRows(section, [lineItemRow]).map((issue) => ({
    rowNumber,
    fieldId: issue.fieldId,
    message: issue.message,
  }));
};

const getPreviewWarnings = (
  fields: ImportPreviewResult['fields'],
  mapping: ImportMapping,
  rowNumber: number,
): readonly ImportPreviewIssue[] =>
  fields.flatMap((field) => {
    if (field.kind === 'Required' && mapping[field.fieldId] === undefined) {
      return [
        {
          rowNumber,
          fieldId: field.fieldId,
          message: `${field.label} is not mapped.`,
        },
      ];
    }

    if (field.kind === 'AutoCalculated' && mapping[field.fieldId] !== undefined) {
      return [
        {
          rowNumber,
          fieldId: field.fieldId,
          message: `${field.label} is auto-calculated.`,
        },
      ];
    }

    return [];
  });
