/** @format */

export type ColumnPatch = {
    readonly columnName: string;
    readonly addColumnSql: string;
};

export type TableDefinition = {
    readonly tableName: string;
    readonly createSql: string;
    readonly requiredColumns: readonly ColumnPatch[];
};

export type IndexDefinition = {
    readonly indexName: string;
    readonly createSql: string;
};

export type StartupCheckOptions = {
    readonly nowIso?: () => string;
};

export type StartupCheckResult = {
    readonly appliedPatches: readonly string[];
    readonly defaultFormatId: string;
    readonly startupHealthSettingKey: string;
};
