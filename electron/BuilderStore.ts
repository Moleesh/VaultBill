/** @format */

import { DatabaseSync } from 'node:sqlite';
import {
    BuilderPackageSchema,
    sanitizeSvg,
    sanitizeTemplateHtml,
    toBuffer,
    type AssetRow,
    type BuilderInventoryItem,
    type BuilderPackage,
    type FormatRow,
    type TemplateRow,
} from './BuilderStoreSupport.js';
import { createBuilderStoreTables } from './BuilderStoreTables.js';

export type { BuilderAsset, BuilderInventoryItem, BuilderPackage } from './BuilderStoreSupport.js';
export class BuilderStore {
    readonly #database: DatabaseSync;
    public constructor(databasePath: string) {
        this.#database = new DatabaseSync(databasePath);
        createBuilderStoreTables(this.#database);
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
