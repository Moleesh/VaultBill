/** @format */

import { z } from 'zod';

import type { StoredDocumentFormat } from '../../engines/schemaEngine/DocumentFormatTypes';
import type { SqliteConnection } from '../sqlite/SqliteConnection';

const documentFormatRowSchema = z.object({
    format_id: z.string(),
    format_name: z.string(),
    format_json: z.string(),
    is_default: z.number(),
});

export const listStoredDocumentFormats = (
    connection: SqliteConnection,
): readonly StoredDocumentFormat[] =>
    connection
        .all(
            `SELECT format_id, format_name, format_json, is_default
        FROM document_formats
        ORDER BY is_default DESC, format_name ASC;`,
        )
        .map((row) => {
            const parsed = documentFormatRowSchema.parse(row);

            return {
                formatId: parsed.format_id,
                formatName: parsed.format_name,
                formatJson: parsed.format_json,
                isDefault: parsed.is_default === 1,
            };
        });
