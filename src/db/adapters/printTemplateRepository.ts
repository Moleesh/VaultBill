/** @format */

import { z } from 'zod';

import {
    PrintTemplateConfigSchema,
    PrintTemplateScopeSchema,
    type PrintTemplateAsset,
    type PrintTemplateConfig,
    type PrintTemplateRecord,
    type PrintTemplateScope,
} from '../../engines/printEngine/PrintTemplateTypes';
import { sanitizeTemplateHtml } from '../../engines/printEngine/TemplateHtmlSanitizer';
import type { SqliteConnection } from '../sqlite/SqliteConnection';
import { stringifyValidatedJson } from '../startup/JsonParsing';

export type SavePrintTemplateInput = {
    readonly templateId: string;
    readonly templateName: string;
    readonly templateHtml: string;
    readonly templateConfig: PrintTemplateConfig;
    readonly scope: PrintTemplateScope;
    readonly updatedAt: string;
};

export type SavePrintTemplateAssetInput = PrintTemplateAsset;

const printTemplateRowSchema = z.object({
    template_id: z.string(),
    template_name: z.string(),
    template_html: z.string(),
    template_json: z.string(),
    template_scope: PrintTemplateScopeSchema,
    updated_at: z.string(),
});

const printTemplateAssetRowSchema = z.object({
    asset_id: z.string(),
    template_id: z.string(),
    asset_name: z.string(),
    mime_type: z.string(),
    asset_blob: z
        .custom<ArrayBufferView>((value): value is ArrayBufferView => ArrayBuffer.isView(value))
        .transform((value) => new Uint8Array(value.buffer, value.byteOffset, value.byteLength)),
    size_bytes: z.number(),
    created_at: z.string(),
});

export const savePrintTemplate = (connection: SqliteConnection, input: SavePrintTemplateInput) => {
    const templateHtml = sanitizeTemplateHtml(input.templateHtml);
    const templateConfig = validateTemplateConfig(input);
    const existing = connection.get(
        'SELECT template_id FROM print_templates WHERE template_id = ?;',
        [input.templateId],
    );
    const parameters = [
        input.templateName,
        templateHtml,
        stringifyValidatedJson(templateConfig, PrintTemplateConfigSchema),
        input.scope,
        input.updatedAt,
        input.templateId,
    ];

    if (existing) {
        connection.run(
            `UPDATE print_templates
        SET template_name = ?, template_html = ?, template_json = ?,
          template_scope = ?, updated_at = ?
        WHERE template_id = ?;`,
            parameters,
        );
        return;
    }

    connection.run(
        `INSERT INTO print_templates
      (template_name, template_html, template_json, template_scope, updated_at,
        template_id)
      VALUES (?, ?, ?, ?, ?, ?);`,
        parameters,
    );
};

export const loadPrintTemplate = (
    connection: SqliteConnection,
    templateId: string,
): PrintTemplateRecord | undefined => {
    const row = connection.get(
        `SELECT template_id, template_name, template_html, template_json,
        template_scope, updated_at
      FROM print_templates
      WHERE template_id = ?;`,
        [templateId],
    );

    return row ? parsePrintTemplateRow(row) : undefined;
};

export const savePrintTemplateAsset = (
    connection: SqliteConnection,
    input: SavePrintTemplateAssetInput,
) => {
    const existing = connection.get(
        'SELECT asset_id FROM print_template_assets WHERE asset_id = ?;',
        [input.assetId],
    );
    const parameters = [
        input.templateId,
        input.assetName,
        input.mimeType,
        input.assetBlob,
        input.sizeBytes,
        input.createdAt,
        input.assetId,
    ];

    if (existing) {
        connection.run(
            `UPDATE print_template_assets
        SET template_id = ?, asset_name = ?, mime_type = ?, asset_blob = ?,
          size_bytes = ?, created_at = ?
        WHERE asset_id = ?;`,
            parameters,
        );
        return;
    }

    connection.run(
        `INSERT INTO print_template_assets
      (template_id, asset_name, mime_type, asset_blob, size_bytes, created_at,
        asset_id)
      VALUES (?, ?, ?, ?, ?, ?, ?);`,
        parameters,
    );
};

export const listPrintTemplateAssets = (
    connection: SqliteConnection,
    templateId: string,
): readonly PrintTemplateAsset[] =>
    connection
        .all(
            `SELECT asset_id, template_id, asset_name, mime_type, asset_blob,
        size_bytes, created_at
      FROM print_template_assets
      WHERE template_id = ?
      ORDER BY asset_name ASC;`,
            [templateId],
        )
        .map(parsePrintTemplateAssetRow);

const validateTemplateConfig = (input: SavePrintTemplateInput): PrintTemplateConfig => {
    const parsed = PrintTemplateConfigSchema.parse(input.templateConfig);

    if (
        parsed.TemplateId !== input.templateId ||
        parsed.TemplateName !== input.templateName ||
        parsed.Scope !== input.scope
    ) {
        throw new Error('Print template metadata must match template JSON.');
    }

    return parsed;
};

const parsePrintTemplateRow = (row: unknown): PrintTemplateRecord => {
    const parsed = printTemplateRowSchema.parse(row);
    const templateConfig: unknown = JSON.parse(parsed.template_json);

    return {
        templateId: parsed.template_id,
        templateName: parsed.template_name,
        templateHtml: sanitizeTemplateHtml(parsed.template_html),
        templateConfig: PrintTemplateConfigSchema.parse(templateConfig),
        scope: parsed.template_scope,
        updatedAt: parsed.updated_at,
    };
};

const parsePrintTemplateAssetRow = (row: unknown): PrintTemplateAsset => {
    const parsed = printTemplateAssetRowSchema.parse(row);

    return {
        assetId: parsed.asset_id,
        templateId: parsed.template_id,
        assetName: parsed.asset_name,
        mimeType: parsed.mime_type,
        assetBlob: parsed.asset_blob,
        sizeBytes: parsed.size_bytes,
        createdAt: parsed.created_at,
    };
};
