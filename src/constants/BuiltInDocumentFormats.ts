/** @format */

import { builtInDefaultFormat } from '../db/startup/BuiltInDefaultFormat';
import type { StoredDocumentFormat } from '../engines/schemaEngine/DocumentFormatTypes';
import type { DocumentFormatSummary } from '../types/AppTypes';

/** Creates a stored document-format payload with updated identity fields. */
const createFormatJson = (formatId: string, formatName: string, description: string): string =>
    JSON.stringify({
        ...builtInDefaultFormat,
        FormatId: formatId,
        FormatName: formatName,
        Description: description,
    });

/** Built-in document formats available before a business publishes custom ones. */
export const builtInStoredFormats: readonly StoredDocumentFormat[] = [
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

/** Lightweight summaries used by records when no published inventory is available. */
export const builtInDocumentFormatSummaries: readonly DocumentFormatSummary[] =
    builtInStoredFormats.map((format) => {
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
    });
