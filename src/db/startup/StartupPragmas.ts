import { z } from 'zod';

import { DatabaseConfigurationError, type SqliteConnection } from '../sqlite/SqliteConnection';

const pragmaForeignKeysSchema = z.object({ foreign_keys: z.number() });

export const enableAndVerifyForeignKeys = (connection: SqliteConnection) => {
  connection.exec('PRAGMA foreign_keys = ON;');
  const row = pragmaForeignKeysSchema.parse(connection.get('PRAGMA foreign_keys;'));

  if (row.foreign_keys !== 1) {
    throw new DatabaseConfigurationError('SQLite foreign keys could not be enabled.');
  }
};
