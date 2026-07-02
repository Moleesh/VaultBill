/** @format */

import type { SqliteConnection } from '../sqlite/SqliteConnection';
import { enableAndVerifyForeignKeys } from './StartupPragmas';
import { createRequiredIndexes, createRequiredTables, patchMissingColumns } from './StartupSchema';
import {
    seedBuiltInDefaultFormatIfNeeded,
    seedBuiltInDefaultPrintTemplateIfNeeded,
    seedRuntimeBrandingIfNeeded,
} from './StartupSeeds';
import { startupHealthSettingKey } from './StartupSettingKeys';
import type { StartupCheckOptions, StartupCheckResult } from './StartupTypes';
import { ensureSingleValidDefaultFormat, validateSettingsReadWrite } from './StartupValidation';

export const runDatabaseStartupChecks = (
    connection: SqliteConnection,
    options: StartupCheckOptions = {},
): StartupCheckResult => {
    const appliedPatches: string[] = [];
    const nowIso = options.nowIso ?? (() => new Date().toISOString());

    enableAndVerifyForeignKeys(connection);
    connection.exec('BEGIN IMMEDIATE TRANSACTION;');

    try {
        createRequiredTables(connection, appliedPatches);
        patchMissingColumns(connection, appliedPatches);
        createRequiredIndexes(connection, appliedPatches);
        seedBuiltInDefaultFormatIfNeeded(connection, nowIso(), appliedPatches);
        seedBuiltInDefaultPrintTemplateIfNeeded(connection, nowIso(), appliedPatches);
        seedRuntimeBrandingIfNeeded(connection, nowIso(), appliedPatches);
        const defaultFormatId = ensureSingleValidDefaultFormat(connection);
        validateSettingsReadWrite(connection, nowIso(), appliedPatches);
        connection.exec('COMMIT;');

        return {
            appliedPatches,
            defaultFormatId,
            startupHealthSettingKey,
        };
    } catch (error) {
        connection.exec('ROLLBACK;');
        throw error;
    }
};
