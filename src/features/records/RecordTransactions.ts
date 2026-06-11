/** @format */

import type { SqliteConnection } from '../../db/sqlite/SqliteConnection';

export const runRecordTransaction = <T>(connection: SqliteConnection, action: () => T): T => {
    connection.exec('BEGIN IMMEDIATE TRANSACTION;');

    try {
        const result = action();
        connection.exec('COMMIT;');
        return result;
    } catch (error) {
        connection.exec('ROLLBACK;');
        throw error;
    }
};
