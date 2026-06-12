/** @format */

/**
 * Shared schemas and helpers for the desktop record store.
 */

import type { DatabaseSync } from 'node:sqlite';
import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

const LineItemSchema = z.object({
    rowId: z.string().min(1),
    itemName: z.string(),
    hsnSac: z.string(),
    quantity: z.string(),
    rate: z.string(),
    taxPercent: z.string(),
    amount: z.string(),
    values: z.record(z.string()).optional(),
});

const EditableRecordSchema = z.object({
    recordId: z.string().min(1),
    formatId: z.string().min(1),
    formatName: z.string().min(1),
    invoiceDate: z.string(),
    customerName: z.string(),
    gstin: z.string(),
    state: z.string(),
    billingAddress: z.string(),
    lineItems: z.array(LineItemSchema),
    grandTotal: z.string(),
    fieldValues: z.record(z.string()).optional(),
});

const OperatorSchema = z.object({
    account: z.object({
        userId: z.string().min(1),
        username: z.string(),
        displayName: z.string().min(1),
        role: z.enum(['SysAdmin', 'Admin', 'User']),
        isActive: z.boolean(),
    }),
    role: z.enum(['SysAdmin', 'Admin', 'User']),
    CreatedBy: z.string().min(1),
    CreatedByName: z.string().min(1),
    LastActionBy: z.string().min(1),
    LastActionByName: z.string().min(1),
});

export const RecordWriteRequestSchema = z.object({
    record: EditableRecordSchema,
    operatorContext: OperatorSchema,
});

export const RecordCancelRequestSchema = z.object({
    recordId: z.string().min(1),
    reason: z.string().trim().min(1),
    operatorContext: OperatorSchema,
});

const StoredRecordSchema = EditableRecordSchema.extend({
    documentNumber: z.string().nullable(),
    status: z.enum(['Draft', 'Finalized', 'Cancelled']),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
    createdBy: z.string().min(1),
    createdByName: z.string().min(1),
    cancellationReason: z.string().optional(),
});

const ReportQuerySchema = z.object({
    reportId: z.enum(['sales-register', 'tax-summary', 'customer-ledger']),
    customer: z.string().default(''),
    invoiceNumber: z.string().default(''),
    fromDate: z.string().default(''),
    toDate: z.string().default(''),
    status: z.enum(['All', 'Draft', 'Finalized', 'Cancelled']).default('All'),
    preset: z.enum(['All', 'Today', 'ThisMonth', 'FinancialYear', 'Last100']).default('All'),
    cursor: z.string().optional(),
    limit: z.number().int().min(1).max(50).default(50),
});

export type StoredRecord = z.infer<typeof StoredRecordSchema>;
export type RecordWriteRequest = z.infer<typeof RecordWriteRequestSchema>;
export type RecordCancelRequest = z.infer<typeof RecordCancelRequestSchema>;
export type TrialStatus = {
    readonly isFullVersion: boolean;
    readonly isExpired: boolean;
    readonly accumulatedSeconds: number;
    readonly remainingSeconds: number;
};
export type ReportQuery = z.input<typeof ReportQuerySchema>;
export type ReportQueryResult = {
    readonly rows: readonly StoredRecord[];
    readonly total: number;
    readonly nextCursor?: string;
};

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
    return row ? StoredRecordSchema.parse(JSON.parse(String(row.record_json))) : undefined;
};

export const listStoredRecords = (database: DatabaseSync): readonly StoredRecord[] =>
    database
        .prepare('SELECT record_json FROM app_records ORDER BY updated_at DESC;')
        .all()
        .map((row) => StoredRecordSchema.parse(JSON.parse(String(row.record_json))));

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
    return StoredRecordSchema.parse({
        ...request.record,
        documentNumber,
        status,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        createdBy: existing?.createdBy ?? request.operatorContext.CreatedBy,
        createdByName: existing?.createdByName ?? request.operatorContext.CreatedByName,
    });
};

export const parseReportQuery = (rawQuery: unknown) => ReportQuerySchema.parse(rawQuery);

export const parseStoredRecord = (rawRecord: unknown) => StoredRecordSchema.parse(rawRecord);

export const safeBufferEqual = (left: string, right: string): boolean => {
    const leftBytes = Buffer.from(left);
    const rightBytes = Buffer.from(right);
    return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
};
