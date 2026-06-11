/** @format */

import type { TableDefinition } from './StartupTypes';

const textColumn = (columnName: string) => ({
    columnName,
    addColumnSql: `${columnName} TEXT`,
});

const requiredTextColumn = (columnName: string) => ({
    columnName,
    addColumnSql: `${columnName} TEXT NOT NULL DEFAULT ''`,
});

const requiredJsonColumn = (columnName: string) => ({
    columnName,
    addColumnSql: `${columnName} TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(${columnName}))`,
});

const requiredUpdatedAtColumn = () => ({
    columnName: 'updated_at',
    addColumnSql: "updated_at TEXT NOT NULL DEFAULT '1970-01-01T00:00:00.000Z'",
});

export const requiredTables: readonly TableDefinition[] = [
    {
        tableName: 'document_formats',
        createSql: `CREATE TABLE IF NOT EXISTS document_formats (
      format_id TEXT PRIMARY KEY,
      format_name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      format_json TEXT NOT NULL CHECK (json_valid(format_json)),
      is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
      updated_at TEXT NOT NULL
    );`,
        requiredColumns: [
            requiredTextColumn('format_id'),
            requiredTextColumn('format_name'),
            requiredJsonColumn('format_json'),
            {
                columnName: 'is_default',
                addColumnSql: 'is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1))',
            },
            requiredUpdatedAtColumn(),
        ],
    },
    {
        tableName: 'records',
        createSql: `CREATE TABLE IF NOT EXISTS records (
      record_id TEXT PRIMARY KEY,
      format_id TEXT NOT NULL,
      format_name TEXT NOT NULL,
      document_number TEXT,
      status TEXT NOT NULL CHECK (status IN ('Draft', 'Finalized', 'Cancelled')),
      record_json TEXT NOT NULL CHECK (json_valid(record_json)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_by_name TEXT NOT NULL,
      last_action_at TEXT,
      last_action_by TEXT,
      last_action_by_name TEXT,
      cancelled_at TEXT,
      cancelled_by TEXT,
      cancelled_by_name TEXT,
      cancelled_reason TEXT,
      FOREIGN KEY (format_id) REFERENCES document_formats(format_id)
    );`,
        requiredColumns: [
            requiredTextColumn('record_id'),
            requiredTextColumn('format_id'),
            requiredTextColumn('format_name'),
            textColumn('document_number'),
            {
                columnName: 'status',
                addColumnSql:
                    "status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Finalized', 'Cancelled'))",
            },
            requiredJsonColumn('record_json'),
            requiredTextColumn('created_at'),
            requiredUpdatedAtColumn(),
            requiredTextColumn('created_by'),
            requiredTextColumn('created_by_name'),
            textColumn('last_action_at'),
            textColumn('last_action_by'),
            textColumn('last_action_by_name'),
            textColumn('cancelled_at'),
            textColumn('cancelled_by'),
            textColumn('cancelled_by_name'),
            textColumn('cancelled_reason'),
        ],
    },
    {
        tableName: 'settings',
        createSql: `CREATE TABLE IF NOT EXISTS settings (
      setting_key TEXT PRIMARY KEY,
      setting_json TEXT NOT NULL CHECK (json_valid(setting_json)),
      updated_at TEXT NOT NULL
    );`,
        requiredColumns: [
            requiredTextColumn('setting_key'),
            requiredJsonColumn('setting_json'),
            requiredUpdatedAtColumn(),
        ],
    },
];
