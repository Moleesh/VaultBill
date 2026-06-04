import { getImportFields } from './ImportFieldCatalog';
import type {
  ImportFieldDescriptor,
  ImportMapping,
  ImportScope,
  SourceColumn,
  SourceTable,
} from './ImportTypes';

export type MappingDetection = {
  readonly fields: readonly ImportFieldDescriptor[];
  readonly sourceColumns: readonly SourceColumn[];
  readonly proposedMapping: ImportMapping;
  readonly dataRows: readonly (readonly string[])[];
};

export const detectImportMapping = (
  scope: ImportScope,
  sourceTable: SourceTable,
): MappingDetection => {
  const fields = getImportFields(scope);
  const firstRow = sourceTable.rows[0] ?? [];
  const hasHeaders = firstRow.some((cell) => matchesAnyField(cell, fields));
  const sourceColumns = createSourceColumns(
    hasHeaders ? firstRow : fields.map((field) => field.label),
  );
  const proposedMapping = hasHeaders
    ? proposeHeaderMapping(fields, sourceColumns)
    : proposeColumnOrderMapping(fields, sourceColumns);

  return {
    fields,
    sourceColumns,
    proposedMapping,
    dataRows: hasHeaders ? sourceTable.rows.slice(1) : sourceTable.rows,
  };
};

const createSourceColumns = (headers: readonly string[]): readonly SourceColumn[] =>
  headers.map((header, columnIndex) => ({
    columnIndex,
    header: header || `Column ${String(columnIndex + 1)}`,
  }));

const proposeHeaderMapping = (
  fields: readonly ImportFieldDescriptor[],
  sourceColumns: readonly SourceColumn[],
): ImportMapping =>
  Object.fromEntries(
    getMappableFields(fields).flatMap((field) => {
      const sourceColumn = sourceColumns.find(
        (column) =>
          normalize(column.header) === normalize(field.fieldId) ||
          normalize(column.header) === normalize(field.label),
      );

      return sourceColumn ? [[field.fieldId, sourceColumn.columnIndex]] : [];
    }),
  );

const proposeColumnOrderMapping = (
  fields: readonly ImportFieldDescriptor[],
  sourceColumns: readonly SourceColumn[],
): ImportMapping =>
  Object.fromEntries(
    getMappableFields(fields)
      .slice(0, sourceColumns.length)
      .map((field, index) => [field.fieldId, index]),
  );

const getMappableFields = (
  fields: readonly ImportFieldDescriptor[],
): readonly ImportFieldDescriptor[] =>
  fields.filter(
    (field) => field.kind !== 'AutoCalculated' && field.kind !== 'SystemGenerated',
  );

const matchesAnyField = (
  value: string,
  fields: readonly ImportFieldDescriptor[],
): boolean =>
  fields.some(
    (field) =>
      normalize(value) === normalize(field.fieldId) ||
      normalize(value) === normalize(field.label),
  );

const normalize = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/gu, '');
