import { z } from 'zod';

import type { SqliteConnection } from '../../db/sqlite/SqliteConnection';

const sequenceRowSchema = z.object({ current_value: z.number() });

export const allocateDocumentNumber = (
  connection: SqliteConnection,
  formatId: string,
  formatName: string,
  nowIso: string,
): string => {
  const existing = connection.get(
    'SELECT current_value FROM sequences WHERE format_id = ?;',
    [formatId],
  );
  const currentValue = existing ? sequenceRowSchema.parse(existing).current_value : 0;
  const nextValue = currentValue + 1;

  if (existing) {
    connection.run(
      `UPDATE sequences
        SET current_value = ?, updated_at = ?
        WHERE format_id = ?;`,
      [nextValue, nowIso, formatId],
    );
  } else {
    connection.run(
      `INSERT INTO sequences
        (sequence_id, format_id, format_name, current_value, updated_at)
        VALUES (?, ?, ?, ?, ?);`,
      [`sequence:${formatId}`, formatId, formatName, nextValue, nowIso],
    );
  }

  return formatDocumentNumber(formatId, nextValue);
};

export const formatDocumentNumber = (formatId: string, sequenceValue: number): string =>
  `${formatId}-${sequenceValue.toString().padStart(6, '0')}`;
