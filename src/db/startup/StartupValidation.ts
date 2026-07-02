/** @format */

import { z } from 'zod';

import { DatabaseConfigurationError, type SqliteConnection } from '../sqlite/SqliteConnection';
import { DocumentFormatConfigSchema, StartupHealthSettingSchema } from './ConfigSchemas';
import { parseJsonWithSchema, stringifyValidatedJson } from './JsonParsing';
import { startupHealthSettingKey } from './StartupSettingKeys';

const defaultFormatRowSchema = z.object({
    format_id: z.string(),
    format_name: z.string(),
    format_json: z.string(),
});

export const ensureSingleValidDefaultFormat = (connection: SqliteConnection): string => {
    const rows = connection
        .all(
            'SELECT format_id, format_name, format_json FROM document_formats WHERE is_default = 1;',
        )
        .map((row) => defaultFormatRowSchema.parse(row));

    if (rows.length !== 1) {
        throw new DatabaseConfigurationError(
            `VaultBill requires exactly one default document format; found ${rows.length.toString()}.`,
        );
    }

    const defaultRow = rows[0];

    if (!defaultRow) {
        throw new DatabaseConfigurationError('Default document format could not be loaded.');
    }

    const formatJson = parseJsonWithSchema(defaultRow.format_json, DocumentFormatConfigSchema);

    if (
        formatJson.FormatId !== defaultRow.format_id ||
        formatJson.FormatName !== defaultRow.format_name
    ) {
        throw new DatabaseConfigurationError(
            'Default document format JSON does not match indexed metadata.',
        );
    }

    return defaultRow.format_id;
};

export const validateSettingsReadWrite = (
    connection: SqliteConnection,
    nowIso: string,
    appliedPatches: string[],
) => {
    const settingJson = stringifyValidatedJson(
        { LastStartupCheckAt: nowIso, SchemaVersion: 2 },
        StartupHealthSettingSchema,
    );

    connection.run(
        `INSERT INTO settings (setting_key, setting_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(setting_key) DO UPDATE SET
        setting_json = excluded.setting_json,
        updated_at = excluded.updated_at;`,
        [startupHealthSettingKey, settingJson, nowIso],
    );

    const row = z
        .object({ setting_json: z.string() })
        .parse(
            connection.get('SELECT setting_json FROM settings WHERE setting_key = ?;', [
                startupHealthSettingKey,
            ]),
        );

    parseJsonWithSchema(row.setting_json, StartupHealthSettingSchema);
    appliedPatches.push('settings:startupHealth');
};
