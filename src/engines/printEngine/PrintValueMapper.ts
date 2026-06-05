import { z } from 'zod';

import type { DocumentRecord } from '../../features/records/DocumentRecordSchema';
import type { PrintCompileWarning, PrintTemplateConfig } from './PrintTemplateTypes';

const companyProfileSchema = z.record(z.string(), z.unknown());

export type BuildRecordPrintValuesInput = {
  readonly record: DocumentRecord;
  readonly templateConfig: PrintTemplateConfig;
  readonly companyProfile?: Readonly<Record<string, unknown>>;
};

export type BuildRecordPrintValuesResult = {
  readonly values: Readonly<Record<string, unknown>>;
  readonly warnings: readonly PrintCompileWarning[];
};

export const buildRecordPrintValues = (
  input: BuildRecordPrintValuesInput,
): BuildRecordPrintValuesResult => {
  const values: Record<string, unknown> = {};
  const warnings: PrintCompileWarning[] = [];

  for (const [placeholder, mapping] of Object.entries(input.templateConfig.Mappings)) {
    const resolved = resolveRecordSource(input.record, mapping.SourceField, input.companyProfile);

    if (resolved === undefined || resolved === null || resolved === '') {
      warnings.push({
        kind: 'MissingPlaceholder',
        placeholder,
        message: `${placeholder} mapping has no source value.`,
      });
    }

    values[placeholder] = resolved;
  }

  return { values, warnings };
};

const resolveRecordSource = (
  record: DocumentRecord,
  sourceField: string,
  companyProfile: Readonly<Record<string, unknown>> | undefined,
): unknown => {
  if (sourceField.startsWith('LineItemSections.')) {
    const sectionId = sourceField.slice('LineItemSections.'.length);
    return record.LineItemSections[sectionId];
  }

  if (sourceField.startsWith('Company.')) {
    return companyProfileSchema.optional().parse(companyProfile)?.[
      sourceField.slice('Company.'.length)
    ];
  }

  const metadata = getRecordMetadata(record);
  const normalizedSource = sourceField.startsWith('Record.')
    ? sourceField.slice('Record.'.length)
    : sourceField;

  return metadata[normalizedSource] ?? record.Values[normalizedSource];
};

const getRecordMetadata = (record: DocumentRecord): Readonly<Record<string, unknown>> => ({
  RecordId: record.RecordId,
  FormatId: record.FormatId,
  FormatName: record.FormatName,
  DocumentNumber: record.DocumentNumber,
  Status: record.Status,
  CreatedAt: record.CreatedAt,
  CreatedBy: record.CreatedBy,
  CreatedByName: record.CreatedByName,
  LastActionAt: record.LastActionAt,
  LastActionBy: record.LastActionBy,
  LastActionByName: record.LastActionByName,
});
