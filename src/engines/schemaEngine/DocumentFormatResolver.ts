/** @format */

import { DatabaseConfigurationError } from '../../db/sqlite/SqliteConnection';
import { DocumentFormatConfigSchema } from '../../db/startup/ConfigSchemas';
import { parseJsonWithSchema } from '../../db/startup/JsonParsing';
import type {
    DeleteFormatDecision,
    DocumentFormatRecord,
    DocumentFormatResolution,
    DocumentFormatSelection,
    StoredDocumentFormat,
} from './DocumentFormatTypes';

export const defaultFormatFallbackWarning =
    'Selected format is unavailable. Default format is used.';

export const resolveDocumentFormatSelection = (
    selection: DocumentFormatSelection,
    storedFormats: readonly StoredDocumentFormat[],
): DocumentFormatResolution => {
    const validFormats = storedFormats.flatMap((format) => {
        const parsed = parseStoredDocumentFormat(format);
        return parsed ? [parsed] : [];
    });

    const byId = selection.formatId
        ? validFormats.find((format) => format.formatId === selection.formatId)
        : undefined;

    if (byId) {
        return { format: byId, fallbackKind: 'None' };
    }

    const byName = selection.formatName
        ? validFormats.find(
              (format) =>
                  format.formatName.toLocaleLowerCase() ===
                  selection.formatName?.toLocaleLowerCase(),
          )
        : undefined;

    if (byName) {
        return { format: byName, fallbackKind: 'FormatName' };
    }

    const defaultFormat = getSingleDefaultFormat(validFormats);

    return {
        format: defaultFormat,
        fallbackKind: 'Default',
        warning: defaultFormatFallbackWarning,
    };
};

export const canDeleteDocumentFormat = (format: DocumentFormatRecord): DeleteFormatDecision => {
    if (format.isDefault) {
        return {
            canDelete: false,
            reason: 'The default document format cannot be deleted.',
        };
    }

    return {
        canDelete: true,
        reason: 'Non-default document formats may be deleted after dependency checks.',
    };
};

const parseStoredDocumentFormat = (
    storedFormat: StoredDocumentFormat,
): DocumentFormatRecord | undefined => {
    try {
        const config = parseJsonWithSchema(storedFormat.formatJson, DocumentFormatConfigSchema);

        if (
            config.FormatId !== storedFormat.formatId ||
            config.FormatName !== storedFormat.formatName
        ) {
            return undefined;
        }

        return {
            formatId: storedFormat.formatId,
            formatName: storedFormat.formatName,
            config,
            isDefault: storedFormat.isDefault,
        };
    } catch {
        return undefined;
    }
};

const getSingleDefaultFormat = (formats: readonly DocumentFormatRecord[]): DocumentFormatRecord => {
    const defaults = formats.filter((format) => format.isDefault);

    if (defaults.length !== 1) {
        throw new DatabaseConfigurationError(
            `VaultBill requires exactly one valid default document format; found ${defaults.length.toString()}.`,
        );
    }

    const defaultFormat = defaults[0];

    if (!defaultFormat) {
        throw new DatabaseConfigurationError('Default document format could not be loaded.');
    }

    return defaultFormat;
};
