import type { ImportMapping, ImportPreviewIssue } from './ImportTypes';

export const findDuplicateExternalNumbers = (
  rows: readonly (readonly string[])[],
  mapping: ImportMapping,
): ReadonlySet<string> => {
  const columnIndex = mapping.ExternalDocumentNumber;

  if (columnIndex === undefined) {
    return new Set();
  }

  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const row of rows) {
    const value = row[columnIndex]?.trim();

    if (!value) {
      continue;
    }

    if (seen.has(value)) {
      duplicates.add(value);
    }

    seen.add(value);
  }

  return duplicates;
};

export const getDuplicateExternalNumberIssue = (
  mapping: ImportMapping,
  rowNumber: number,
  duplicateExternalNumbers: ReadonlySet<string>,
  sourceRow: readonly string[],
): readonly ImportPreviewIssue[] => {
  const columnIndex = mapping.ExternalDocumentNumber;
  const value = columnIndex === undefined ? undefined : sourceRow[columnIndex]?.trim();

  return value && duplicateExternalNumbers.has(value)
    ? [
        {
          rowNumber,
          fieldId: 'ExternalDocumentNumber',
          message: `External document number ${value} is duplicated.`,
        },
      ]
    : [];
};
