/** @format */

/**
 * Shared helpers for the desktop record store and its SQLite-backed runtime
 * bookkeeping.
 */

import type { DatabaseSync } from 'node:sqlite';
import { timingSafeEqual } from 'node:crypto';

import {
    parseStoredRecord,
    type RecordWriteRequest,
    type StoredRecord,
} from './RecordStoreSchemas.js';

export {
    parseReportQuery,
    parseStoredRecord,
    RecordCancelRequestSchema,
    RecordWriteRequestSchema,
    type RecordCancelRequest,
    type RecordWriteRequest,
    type ReportQuery,
    type ReportQueryResult,
    type StoredRecord,
    type TrialStatus,
} from './RecordStoreSchemas.js';

export const createRecordStoreTables = (database: DatabaseSync) => {
    database.exec(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS app_records (
        record_id TEXT PRIMARY KEY,
        status TEXT NOT NULL CHECK (status IN ('Draft', 'Finalized', 'Cancelled')),
        document_number TEXT UNIQUE,
        record_json TEXT NOT NULL CHECK (json_valid(record_json)),
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS app_sequences (
        sequence_id TEXT PRIMARY KEY,
        next_value INTEGER NOT NULL CHECK (next_value > 0)
      );
      INSERT OR IGNORE INTO app_sequences (sequence_id, next_value) VALUES ('GST', 1);
      CREATE TABLE IF NOT EXISTS app_runtime (
        runtime_key TEXT PRIMARY KEY,
        runtime_value TEXT NOT NULL
      );
      INSERT OR IGNORE INTO app_runtime (runtime_key, runtime_value) VALUES ('trial_seconds', '0');
      INSERT OR IGNORE INTO app_runtime (runtime_key, runtime_value) VALUES ('activated', 'false');
    `);
};

export const getStoredRecord = (
    database: DatabaseSync,
    recordId: string,
): StoredRecord | undefined => {
    const row = database
        .prepare('SELECT record_json FROM app_records WHERE record_id = ?;')
        .get(recordId);
    return row ? parseStoredRecord(JSON.parse(String(row.record_json))) : undefined;
};

export const listStoredRecords = (database: DatabaseSync): readonly StoredRecord[] =>
    database
        .prepare('SELECT record_json FROM app_records ORDER BY updated_at DESC;')
        .all()
        .map((row) => parseStoredRecord(JSON.parse(String(row.record_json))));

export const writeStoredRecord = (database: DatabaseSync, record: StoredRecord) => {
    database
        .prepare(
            `
        INSERT INTO app_records (record_id, status, document_number, record_json, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(record_id) DO UPDATE SET
          status = excluded.status,
          document_number = excluded.document_number,
          record_json = excluded.record_json,
          updated_at = excluded.updated_at;
      `,
        )
        .run(
            record.recordId,
            record.status,
            record.documentNumber,
            JSON.stringify(record),
            record.updatedAt,
        );
};

export const getTrialSeconds = (database: DatabaseSync): number => {
    const row = database
        .prepare("SELECT runtime_value FROM app_runtime WHERE runtime_key = 'trial_seconds';")
        .get();
    return Number.parseInt(String(row?.runtime_value ?? '0'), 10) || 0;
};

export const isActivated = (database: DatabaseSync): boolean => {
    const row = database
        .prepare("SELECT runtime_value FROM app_runtime WHERE runtime_key = 'activated';")
        .get();
    return String(row?.runtime_value ?? 'false') === 'true';
};

export const writeRuntime = (database: DatabaseSync, key: string, value: string) => {
    database
        .prepare(
            'INSERT INTO app_runtime (runtime_key, runtime_value) VALUES (?, ?) ON CONFLICT(runtime_key) DO UPDATE SET runtime_value = excluded.runtime_value;',
        )
        .run(key, value);
};

export const buildStoredRecord = (
    request: RecordWriteRequest,
    existing: StoredRecord | undefined,
    status: StoredRecord['status'],
    documentNumber: string | null,
): StoredRecord => {
    const now = new Date().toISOString();
    return {
        ...request.record,
        documentNumber,
        status,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        createdBy: existing?.createdBy ?? request.operatorContext.CreatedBy,
        createdByName: existing?.createdByName ?? request.operatorContext.CreatedByName,
    };
};

export const safeBufferEqual = (left: string, right: string): boolean => {
    const leftBytes = Buffer.from(left);
    const rightBytes = Buffer.from(right);
    return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
};
