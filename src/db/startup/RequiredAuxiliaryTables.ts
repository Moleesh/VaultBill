import type { TableDefinition } from './StartupTypes';
import {
  requiredIntegerColumn,
  requiredJsonColumn,
  requiredTextColumn,
  textColumn,
} from './RequiredColumnBuilders';

export const requiredAuxiliaryTables: readonly TableDefinition[] = [
  {
    tableName: 'print_templates',
    createSql: `CREATE TABLE IF NOT EXISTS print_templates (
      template_id TEXT PRIMARY KEY,
      template_name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      template_html TEXT NOT NULL,
      template_json TEXT NOT NULL CHECK (json_valid(template_json)),
      template_scope TEXT NOT NULL CHECK (template_scope IN ('Record', 'Report')),
      updated_at TEXT NOT NULL
    );`,
    requiredColumns: [
      requiredTextColumn('template_id'),
      requiredTextColumn('template_name'),
      requiredTextColumn('template_html'),
      requiredJsonColumn('template_json'),
      {
        columnName: 'template_scope',
        addColumnSql:
          "template_scope TEXT NOT NULL DEFAULT 'Record' CHECK (template_scope IN ('Record', 'Report'))",
      },
      requiredTextColumn('updated_at'),
    ],
  },
  {
    tableName: 'print_template_assets',
    createSql: `CREATE TABLE IF NOT EXISTS print_template_assets (
      asset_id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      asset_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      asset_blob BLOB NOT NULL,
      size_bytes INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (template_id) REFERENCES print_templates(template_id) ON DELETE CASCADE
    );`,
    requiredColumns: [
      requiredTextColumn('asset_id'),
      requiredTextColumn('template_id'),
      requiredTextColumn('asset_name'),
      requiredTextColumn('mime_type'),
      {
        columnName: 'asset_blob',
        addColumnSql: "asset_blob BLOB NOT NULL DEFAULT X''",
      },
      requiredIntegerColumn('size_bytes'),
      requiredTextColumn('created_at'),
    ],
  },
  {
    tableName: 'app_assets',
    createSql: `CREATE TABLE IF NOT EXISTS app_assets (
      asset_id TEXT PRIMARY KEY,
      asset_name TEXT NOT NULL UNIQUE,
      mime_type TEXT NOT NULL,
      asset_blob BLOB NOT NULL,
      size_bytes INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );`,
    requiredColumns: [
      requiredTextColumn('asset_id'),
      requiredTextColumn('asset_name'),
      requiredTextColumn('mime_type'),
      {
        columnName: 'asset_blob',
        addColumnSql: "asset_blob BLOB NOT NULL DEFAULT X''",
      },
      requiredIntegerColumn('size_bytes'),
      requiredTextColumn('created_at'),
    ],
  },
  {
    tableName: 'reports',
    createSql: `CREATE TABLE IF NOT EXISTS reports (
      report_id TEXT PRIMARY KEY,
      report_name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      report_json TEXT NOT NULL CHECK (json_valid(report_json)),
      updated_at TEXT NOT NULL
    );`,
    requiredColumns: [
      requiredTextColumn('report_id'),
      requiredTextColumn('report_name'),
      requiredJsonColumn('report_json'),
      requiredTextColumn('updated_at'),
    ],
  },
  {
    tableName: 'printer_profiles',
    createSql: `CREATE TABLE IF NOT EXISTS printer_profiles (
      profile_id TEXT PRIMARY KEY,
      profile_name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      profile_json TEXT NOT NULL CHECK (json_valid(profile_json)),
      is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
      updated_at TEXT NOT NULL
    );`,
    requiredColumns: [
      requiredTextColumn('profile_id'),
      requiredTextColumn('profile_name'),
      requiredJsonColumn('profile_json'),
      requiredIntegerColumn('is_default'),
      requiredTextColumn('updated_at'),
    ],
  },
  {
    tableName: 'attachments',
    createSql: `CREATE TABLE IF NOT EXISTS attachments (
      attachment_id TEXT PRIMARY KEY,
      record_id TEXT NOT NULL,
      field_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      attachment_blob BLOB NOT NULL,
      size_bytes INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (record_id) REFERENCES records(record_id) ON DELETE CASCADE
    );`,
    requiredColumns: [
      requiredTextColumn('attachment_id'),
      requiredTextColumn('record_id'),
      requiredTextColumn('field_id'),
      requiredTextColumn('file_name'),
      requiredTextColumn('mime_type'),
      {
        columnName: 'attachment_blob',
        addColumnSql: "attachment_blob BLOB NOT NULL DEFAULT X''",
      },
      requiredIntegerColumn('size_bytes'),
      requiredTextColumn('created_at'),
    ],
  },
  {
    tableName: 'sequences',
    createSql: `CREATE TABLE IF NOT EXISTS sequences (
      sequence_id TEXT PRIMARY KEY,
      format_id TEXT NOT NULL UNIQUE,
      format_name TEXT NOT NULL,
      current_value INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (format_id) REFERENCES document_formats(format_id)
    );`,
    requiredColumns: [
      requiredTextColumn('sequence_id'),
      requiredTextColumn('format_id'),
      requiredTextColumn('format_name'),
      requiredIntegerColumn('current_value'),
      requiredTextColumn('updated_at'),
    ],
  },
  {
    tableName: 'users',
    createSql: `CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('SysAdmin', 'Admin', 'User')),
      pin_hash TEXT,
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
    requiredColumns: [
      requiredTextColumn('user_id'),
      requiredTextColumn('username'),
      requiredTextColumn('display_name'),
      {
        columnName: 'role',
        addColumnSql:
          "role TEXT NOT NULL DEFAULT 'User' CHECK (role IN ('SysAdmin', 'Admin', 'User'))",
      },
      textColumn('pin_hash'),
      {
        columnName: 'is_active',
        addColumnSql: 'is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))',
      },
      requiredTextColumn('created_at'),
      requiredTextColumn('updated_at'),
    ],
  },
];
