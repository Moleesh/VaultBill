/** @format */

import type { DatabaseSync } from 'node:sqlite';

export const createBuilderStoreTables = (database: DatabaseSync) => {
    database.exec(`
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
};
