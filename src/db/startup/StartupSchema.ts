import { z } from 'zod';

import { requiredAuxiliaryTables } from './RequiredAuxiliaryTables';
import { requiredIndexes } from './RequiredIndexes';
import { requiredTables } from './RequiredTables';
import type { ColumnPatch } from './StartupTypes';
import { DatabaseRecoveryError, type SqliteConnection } from '../sqlite/SqliteConnection';

const tableInfoRowSchema = z.object({ name: z.string() }).passthrough();

export const createRequiredTables = (connection: SqliteConnection, appliedPatches: string[]) => {
  for (const table of [...requiredTables, ...requiredAuxiliaryTables]) {
    connection.exec(table.createSql);
    appliedPatches.push(`table:${table.tableName}`);
  }
};

export const patchMissingColumns = (connection: SqliteConnection, appliedPatches: string[]) => {
  for (const table of [...requiredTables, ...requiredAuxiliaryTables]) {
    const existingColumns = new Set(
      connection
        .all(`PRAGMA table_info(${table.tableName});`)
        .map((row) => tableInfoRowSchema.parse(row).name),
    );

    for (const column of table.requiredColumns) {
      addMissingColumn(connection, table.tableName, existingColumns, column, appliedPatches);
    }
  }
};

export const createRequiredIndexes = (connection: SqliteConnection, appliedPatches: string[]) => {
  for (const index of requiredIndexes) {
    try {
      connection.exec(index.createSql);
      appliedPatches.push(`index:${index.indexName}`);
    } catch (error) {
      throw new DatabaseRecoveryError(
        `Could not create required index ${index.indexName}. Duplicate existing data may need recovery before VaultBill can start.`,
        { cause: error },
      );
    }
  }
};

const addMissingColumn = (
  connection: SqliteConnection,
  tableName: string,
  existingColumns: ReadonlySet<string>,
  column: ColumnPatch,
  appliedPatches: string[],
) => {
  if (existingColumns.has(column.columnName)) {
    return;
  }

  connection.exec(`ALTER TABLE ${tableName} ADD COLUMN ${column.addColumnSql};`);
  appliedPatches.push(`column:${tableName}.${column.columnName}`);
};
