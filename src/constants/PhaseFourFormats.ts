import { builtInDefaultFormat } from '../db/startup/BuiltInDefaultFormat';
import type { StoredDocumentFormat } from '../engines/schemaEngine/DocumentFormatTypes';
import type { DocumentFormatSummary } from '../types/AppTypes';

const createFormatJson = (formatId: string, formatName: string, description: string): string =>
  JSON.stringify({
    ...builtInDefaultFormat,
    FormatId: formatId,
    FormatName: formatName,
    Description: description,
  });

export const phaseFourStoredFormats: readonly StoredDocumentFormat[] = [
  {
    formatId: builtInDefaultFormat.FormatId,
    formatName: builtInDefaultFormat.FormatName,
    formatJson: JSON.stringify(builtInDefaultFormat),
    isDefault: true,
  },
  {
    formatId: 'Bill',
    formatName: 'Bill',
    formatJson: createFormatJson('Bill', 'Bill', 'Simple bill format placeholder.'),
    isDefault: false,
  },
  {
    formatId: 'DeliveryNote',
    formatName: 'Delivery Note',
    formatJson: createFormatJson(
      'DeliveryNote',
      'Delivery Note',
      'Delivery-note format placeholder.',
    ),
    isDefault: false,
  },
];

export const documentFormatSummaries: readonly DocumentFormatSummary[] = phaseFourStoredFormats.map(
  (format) => {
    const parsed: unknown = JSON.parse(format.formatJson);
    const description =
      typeof parsed === 'object' &&
      parsed !== null &&
      'Description' in parsed &&
      typeof parsed.Description === 'string'
        ? parsed.Description
        : '';

    return {
      formatId: format.formatId,
      formatName: format.formatName,
      description,
      isDefault: format.isDefault,
    };
  },
);
