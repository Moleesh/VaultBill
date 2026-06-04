import type { SqliteConnection } from '../../db/sqlite/SqliteConnection';
import type { DocumentRecord } from './DocumentRecordSchema';
import { stringifyDocumentRecord } from './RecordJson';

export const insertRecordRow = (
  connection: SqliteConnection,
  record: DocumentRecord,
  updatedAt: string,
) => {
  connection.run(
    `INSERT INTO records
      (record_id, format_id, format_name, document_number, status, record_json,
        created_at, updated_at, created_by, created_by_name, last_action_at,
        last_action_by, last_action_by_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      record.RecordId,
      record.FormatId,
      record.FormatName,
      record.DocumentNumber,
      record.Status,
      stringifyDocumentRecord(record),
      record.CreatedAt,
      updatedAt,
      record.CreatedBy,
      record.CreatedByName,
      record.LastActionAt,
      record.LastActionBy,
      record.LastActionByName,
    ],
  );
};

export const updateRecordRow = (
  connection: SqliteConnection,
  record: DocumentRecord,
  updatedAt: string,
) => {
  connection.run(
    `UPDATE records
      SET format_id = ?, format_name = ?, document_number = ?, status = ?,
        record_json = ?, updated_at = ?, last_action_at = ?, last_action_by = ?,
        last_action_by_name = ?
      WHERE record_id = ?;`,
    [
      record.FormatId,
      record.FormatName,
      record.DocumentNumber,
      record.Status,
      stringifyDocumentRecord(record),
      updatedAt,
      record.LastActionAt,
      record.LastActionBy,
      record.LastActionByName,
      record.RecordId,
    ],
  );
};
