/** @format */

import { z } from 'zod';

/**
 * Defines the allowed asset formats that can be bundled alongside a print
 * template.
 */
export const BuilderAssetSchema = z.object({
    name: z.string().trim().min(1),
    type: z.enum([
        'image/png',
        'image/jpeg',
        'image/webp',
        'image/svg+xml',
        'font/woff',
        'font/woff2',
        'application/font-woff',
    ]),
    dataBase64: z.string(),
});

/** Represents one reusable HTML print template stored with the builder package. */
export const SavedPrintTemplateSchema = z.object({
    name: z.string().trim().min(1),
    templateHtml: z.string().min(1),
    updatedAt: z.string().min(1),
});

/** Validates the persisted document-format package used by the Builder. */
export const BuilderPackageSchema = z.object({
    config: z
        .object({
            FormatId: z.string().trim().min(1),
            FormatName: z.string().trim().min(1),
        })
        .passthrough(),
    templateHtml: z.string().min(1),
    assets: z.array(BuilderAssetSchema),
    savedTemplates: z.array(SavedPrintTemplateSchema).default([]),
});

/** Represents one shared asset attached to a builder package. */
export type BuilderAsset = z.infer<typeof BuilderAssetSchema>;
/** Represents one saved HTML template shared with the builder package. */
export type SavedPrintTemplate = z.infer<typeof SavedPrintTemplateSchema>;
/** Represents the versioned JSON package persisted by the Builder. */
export type BuilderPackage = z.infer<typeof BuilderPackageSchema>;

/** Summarizes a stored format for inventory and sidebar listings. */
export type BuilderInventoryItem = {
    readonly formatId: string;
    readonly formatName: string;
    readonly isDefault: boolean;
    readonly updatedAt: string;
    readonly templateName?: string;
    readonly assetCount: number;
    readonly isValid: boolean;
};

/** Raw format row returned from SQLite. */
export type FormatRow = {
    readonly format_json: unknown;
};

/** Raw template row returned from SQLite. */
export type TemplateRow = {
    readonly template_html: unknown;
};

/** Rejects unsafe HTML before it is saved as a print template. */
export const sanitizeTemplateHtml = (html: string): string => {
    if (/<\s*\/?\s*(script|iframe|object|embed|form|meta|link)\b/iu.test(html)) {
        throw new Error('Print template HTML contains a blocked element.');
    }
    if (/\son[a-z]+\s*=/iu.test(html) || /(?:https?:\/\/|javascript:|file:)/iu.test(html)) {
        throw new Error('Print template HTML contains blocked active or external content.');
    }
    if (/@import\s+/iu.test(html)) throw new Error('Print template CSS cannot import resources.');
    return html;
};

/** Rejects SVG content that can execute code or load external resources. */
export const sanitizeSvg = (svg: string) => {
    if (
        /<\s*(script|foreignObject|iframe|object|embed|form)\b/iu.test(svg) ||
        /\son[a-z]+\s*=/iu.test(svg) ||
        /(?:https?:\/\/|javascript:|file:)/iu.test(svg)
    ) {
        throw new Error(
            'SVG assets cannot contain scripts, active content, or external resources.',
        );
    }
};

/** Normalizes SQLite blob values into a Node Buffer. */
export const toBuffer = (value: unknown): Buffer => {
    if (Buffer.isBuffer(value)) return value;
    if (ArrayBuffer.isView(value))
        return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
    if (value instanceof Uint8Array) return Buffer.from(value);
    if (value instanceof ArrayBuffer) return Buffer.from(value);
    if (typeof value === 'string') return Buffer.from(value);
    throw new Error('Builder asset data is invalid.');
};

/** Maps SQLite asset rows into normalized builder assets. */
export const mapBuilderAssetRows = (
    rows: readonly Record<string, unknown>[],
): readonly BuilderAsset[] =>
    rows.map((row) => ({
        name: String(row.asset_name),
        type: BuilderAssetSchema.shape.type.parse(String(row.mime_type)),
        dataBase64: toBuffer(row.asset_blob).toString('base64'),
    }));

/** Maps SQLite template rows into normalized saved print templates. */
export const mapSavedPrintTemplateRows = (
    rows: readonly Record<string, unknown>[],
): readonly SavedPrintTemplate[] =>
    rows.map((row) => ({
        name: String(row.template_name),
        templateHtml: String(row.template_html),
        updatedAt: String(row.updated_at),
    }));

/** Maps SQLite inventory rows into builder inventory entries. */
export const mapBuilderInventoryRows = (
    rows: readonly Record<string, unknown>[],
): readonly BuilderInventoryItem[] =>
    rows.map((row) => {
        let isValid = Boolean(row.template_html);
        try {
            JSON.parse(String(row.format_json));
        } catch {
            isValid = false;
        }
        return {
            formatId: String(row.format_id),
            formatName: String(row.format_name),
            isDefault: Number(row.is_default) === 1,
            updatedAt: String(row.updated_at),
            ...(typeof row.template_name === 'string' && row.template_name.length > 0
                ? { templateName: row.template_name }
                : {}),
            assetCount: Number(row.asset_count),
            isValid,
        };
    });
