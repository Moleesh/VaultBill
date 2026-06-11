/**
 * eslint-disable max-lines
 *
 * @format
 */

/** @format */

/** Builder store that persists document formats, templates, and sample assets. */

import { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';

const BuilderAssetSchema = z.object({
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
const BuilderPackageSchema = z.object({
    config: z
        .object({
            FormatId: z.string().trim().min(1),
            FormatName: z.string().trim().min(1),
        })
        .passthrough(),
    templateHtml: z.string().min(1),
    assets: z.array(BuilderAssetSchema),
});

export type BuilderAsset = z.infer<typeof BuilderAssetSchema>;
export type BuilderPackage = z.infer<typeof BuilderPackageSchema>;
export type BuilderInventoryItem = {
    readonly formatId: string;
    readonly formatName: string;
    readonly isDefault: boolean;
    readonly updatedAt: string;
    readonly templateName?: string;
    readonly assetCount: number;
    readonly isValid: boolean;
};

type FormatRow = {
    readonly format_json: unknown;
};

type TemplateRow = {
    readonly template_html: unknown;
};

type AssetRow = {
    readonly asset_name: unknown;
    readonly mime_type: unknown;
    readonly asset_blob: unknown;
};

export class BuilderStore {
    readonly #database: DatabaseSync;

    public constructor(databasePath: string) {
        this.#database = new DatabaseSync(databasePath);
        this.#database.exec(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS document_formats (
        format_id TEXT PRIMARY KEY,
        format_name TEXT NOT NULL UNIQUE COLLATE NOCASE,
        format_json TEXT NOT NULL CHECK (json_valid(format_json)),
        is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
        updated_at TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS ux_document_formats_single_default
        ON document_formats(is_default) WHERE is_default = 1;
      CREATE TABLE IF NOT EXISTS print_templates (
        template_id TEXT PRIMARY KEY,
        template_name TEXT NOT NULL UNIQUE COLLATE NOCASE,
        template_html TEXT NOT NULL,
        template_json TEXT NOT NULL CHECK (json_valid(template_json)),
        template_scope TEXT NOT NULL CHECK (template_scope IN ('Record', 'Report')),
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS print_template_assets (
        asset_id TEXT PRIMARY KEY,
        template_id TEXT NOT NULL,
        asset_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        asset_blob BLOB NOT NULL,
        size_bytes INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(template_id, asset_name),
        FOREIGN KEY (template_id) REFERENCES print_templates(template_id) ON DELETE CASCADE
      );
    `);
    }

    public load = (formatId?: string): BuilderPackage | undefined => {
        const format = (
            formatId
                ? this.#database
                      .prepare('SELECT format_json FROM document_formats WHERE format_id = ?;')
                      .get(formatId)
                : this.#database
                      .prepare(
                          `SELECT format_json FROM document_formats
              ORDER BY is_default DESC, updated_at DESC LIMIT 1;`,
                      )
                      .get()
        ) as FormatRow | undefined;
        if (!format) return undefined;
        const config = JSON.parse(String(format.format_json)) as BuilderPackage['config'];
        const template = this.#database
            .prepare('SELECT template_html FROM print_templates WHERE template_id = ?;')
            .get(config.FormatId) as TemplateRow | undefined;
        if (!template) return undefined;
        const assets = this.#database
            .prepare(
                `SELECT asset_name, mime_type, asset_blob
        FROM print_template_assets
        WHERE template_id = ?
        ORDER BY asset_name COLLATE NOCASE;`,
            )
            .all(config.FormatId)
            .map((row) => {
                const asset = row as AssetRow;
                return {
                    name: String(asset.asset_name),
                    type: String(asset.mime_type),
                    dataBase64: toBuffer(asset.asset_blob).toString('base64'),
                };
            });
        return BuilderPackageSchema.parse({
            config,
            templateHtml: String(template.template_html),
            assets,
        });
    };

    public loadDefault = (): BuilderPackage | undefined => this.load();

    public save = (rawPackage: unknown): BuilderPackage => {
        const builderPackage = BuilderPackageSchema.parse(rawPackage);
        const templateHtml = sanitizeTemplateHtml(builderPackage.templateHtml);
        const now = new Date().toISOString();
        const { FormatId: formatId, FormatName: formatName } = builderPackage.config;
        const hasDefault =
            Number(
                this.#database
                    .prepare('SELECT COUNT(*) AS count FROM document_formats WHERE is_default = 1;')
                    .get()?.count ?? 0,
            ) > 0;

        this.#database.exec('BEGIN IMMEDIATE;');
        try {
            this.#database
                .prepare(
                    `INSERT INTO document_formats
            (format_id, format_name, format_json, is_default, updated_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(format_id) DO UPDATE SET
            format_name = excluded.format_name,
            format_json = excluded.format_json,
            updated_at = excluded.updated_at;`,
                )
                .run(
                    formatId,
                    formatName,
                    JSON.stringify(builderPackage.config),
                    hasDefault ? 0 : 1,
                    now,
                );
            this.#database
                .prepare(
                    `INSERT INTO print_templates
            (template_id, template_name, template_html, template_json, template_scope, updated_at)
          VALUES (?, ?, ?, ?, 'Record', ?)
          ON CONFLICT(template_id) DO UPDATE SET
            template_name = excluded.template_name,
            template_html = excluded.template_html,
            template_json = excluded.template_json,
            updated_at = excluded.updated_at;`,
                )
                .run(
                    formatId,
                    `${formatName} Print`,
                    templateHtml,
                    JSON.stringify({ FormatId: formatId }),
                    now,
                );
            this.#database
                .prepare('DELETE FROM print_template_assets WHERE template_id = ?;')
                .run(formatId);
            const insertAsset = this.#database.prepare(
                `INSERT INTO print_template_assets
          (asset_id, template_id, asset_name, mime_type, asset_blob, size_bytes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?);`,
            );
            for (const asset of builderPackage.assets) {
                const bytes = Buffer.from(asset.dataBase64, 'base64');
                if (asset.type === 'image/svg+xml') sanitizeSvg(bytes.toString('utf8'));
                insertAsset.run(
                    `${formatId}:${asset.name}`,
                    formatId,
                    asset.name,
                    asset.type,
                    bytes,
                    bytes.length,
                    now,
                );
            }
            this.#database.exec('COMMIT;');
            return { ...builderPackage, templateHtml };
        } catch (error) {
            this.#database.exec('ROLLBACK;');
            throw error;
        }
    };

    public listInventory = (): readonly BuilderInventoryItem[] =>
        this.#database
            .prepare(
                `SELECT f.format_id, f.format_name, f.format_json, f.is_default, f.updated_at,
          t.template_name, t.template_html,
          COUNT(a.asset_id) AS asset_count
        FROM document_formats f
        LEFT JOIN print_templates t ON t.template_id = f.format_id
        LEFT JOIN print_template_assets a ON a.template_id = t.template_id
        GROUP BY f.format_id, f.format_name, f.format_json, f.is_default, f.updated_at,
          t.template_name, t.template_html
        ORDER BY f.is_default DESC, f.format_name COLLATE NOCASE;`,
            )
            .all()
            .map((row) => {
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
                    ...(row.template_name ? { templateName: String(row.template_name) } : {}),
                    assetCount: Number(row.asset_count),
                    isValid,
                };
            });

    public close = () => {
        this.#database.close();
    };
}

const sanitizeTemplateHtml = (html: string): string => {
    if (/<\s*\/?\s*(script|iframe|object|embed|form|meta|link)\b/iu.test(html)) {
        throw new Error('Print template HTML contains a blocked element.');
    }
    if (/\son[a-z]+\s*=/iu.test(html) || /(?:https?:\/\/|javascript:|file:)/iu.test(html)) {
        throw new Error('Print template HTML contains blocked active or external content.');
    }
    if (/@import\s+/iu.test(html)) throw new Error('Print template CSS cannot import resources.');
    return html;
};

const sanitizeSvg = (svg: string) => {
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

const toBuffer = (value: unknown): Buffer => {
    if (Buffer.isBuffer(value)) return value;
    if (value instanceof Uint8Array) return Buffer.from(value);
    throw new Error('Builder asset data is invalid.');
};
