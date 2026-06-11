import { z } from 'zod';

import { builtInDefaultFormat, defaultRuntimeBrandingSetting } from './BuiltInDefaultFormat';
import { DocumentFormatConfigSchema, RuntimeBrandingSchema } from './ConfigSchemas';
import { stringifyValidatedJson } from './JsonParsing';
import {
  builtInDefaultPrintAsset,
  builtInDefaultPrintTemplateHtml,
  builtInDefaultPrintTemplateJson,
} from './BuiltInDefaultPrintTemplate';
import { runtimeBrandingSettingKey } from './StartupSettingKeys';
import type { SqliteConnection } from '../sqlite/SqliteConnection';

const countRowSchema = z.object({ count: z.number() });

export const seedBuiltInDefaultFormatIfNeeded = (
  connection: SqliteConnection,
  nowIso: string,
  appliedPatches: string[],
) => {
  const row = countRowSchema.parse(
    connection.get('SELECT COUNT(*) AS count FROM document_formats;'),
  );

  if (row.count > 0) {
    return;
  }

  connection.run(
    `INSERT INTO document_formats
      (format_id, format_name, format_json, is_default, updated_at)
      VALUES (?, ?, ?, 1, ?);`,
    [
      builtInDefaultFormat.FormatId,
      builtInDefaultFormat.FormatName,
      stringifyValidatedJson(builtInDefaultFormat, DocumentFormatConfigSchema),
      nowIso,
    ],
  );
  connection.run(
    `INSERT INTO sequences
      (sequence_id, format_id, format_name, current_value, updated_at)
      VALUES (?, ?, ?, 0, ?);`,
    [
      `sequence:${builtInDefaultFormat.FormatId}`,
      builtInDefaultFormat.FormatId,
      builtInDefaultFormat.FormatName,
      nowIso,
    ],
  );
  appliedPatches.push('seed:builtInDefaultFormat');
};

export const seedRuntimeBrandingIfNeeded = (
  connection: SqliteConnection,
  nowIso: string,
  appliedPatches: string[],
) => {
  const existing = connection.get('SELECT setting_key FROM settings WHERE setting_key = ?;', [
    runtimeBrandingSettingKey,
  ]);

  if (existing) {
    return;
  }

  connection.run(
    `INSERT INTO settings (setting_key, setting_json, updated_at)
      VALUES (?, ?, ?);`,
    [
      runtimeBrandingSettingKey,
      stringifyValidatedJson(defaultRuntimeBrandingSetting, RuntimeBrandingSchema),
      nowIso,
    ],
  );
  appliedPatches.push('seed:runtimeBranding');
};

export const seedBuiltInDefaultPrintTemplateIfNeeded = (
  connection: SqliteConnection,
  nowIso: string,
  appliedPatches: string[],
) => {
  const row = countRowSchema.parse(
    connection.get('SELECT COUNT(*) AS count FROM print_templates WHERE template_id = ?;', [
      builtInDefaultFormat.FormatId,
    ]),
  );

  if (row.count > 0) {
    return;
  }

  connection.run(
    `INSERT INTO print_templates
      (template_id, template_name, template_html, template_json, template_scope, updated_at)
      VALUES (?, ?, ?, ?, 'Record', ?);`,
    [
      builtInDefaultFormat.FormatId,
      `${builtInDefaultFormat.FormatName} Print`,
      builtInDefaultPrintTemplateHtml,
      JSON.stringify(builtInDefaultPrintTemplateJson),
      nowIso,
    ],
  );
  connection.run(
    `INSERT INTO print_template_assets
      (asset_id, template_id, asset_name, mime_type, asset_blob, size_bytes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      `${builtInDefaultFormat.FormatId}:${builtInDefaultPrintAsset.name}`,
      builtInDefaultFormat.FormatId,
      builtInDefaultPrintAsset.name,
      builtInDefaultPrintAsset.type,
      Buffer.from(builtInDefaultPrintAsset.svg, 'utf8'),
      Buffer.byteLength(builtInDefaultPrintAsset.svg, 'utf8'),
      nowIso,
    ],
  );
  appliedPatches.push('seed:builtInDefaultPrintTemplate');
};
