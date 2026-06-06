import { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';

const LineItemSchema = z.object({
  rowId: z.string().min(1),
  itemName: z.string(),
  hsnSac: z.string(),
  quantity: z.string(),
  rate: z.string(),
  taxPercent: z.string(),
  amount: z.string(),
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

export type StoredRecord = z.infer<typeof StoredRecordSchema>;
export type RecordWriteRequest = z.infer<typeof RecordWriteRequestSchema>;
export type RecordCancelRequest = z.infer<typeof RecordCancelRequestSchema>;

export class DesktopRecordStore {
  readonly #database: DatabaseSync;

  public constructor(databasePath: string) {
    this.#database = new DatabaseSync(databasePath);
    this.#database.exec(`
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
    `);
  }

  public list = (): readonly StoredRecord[] =>
    this.#database
      .prepare('SELECT record_json FROM app_records ORDER BY updated_at DESC;')
      .all()
      .map((row) => StoredRecordSchema.parse(JSON.parse(String(row.record_json))));

  public saveDraft = (rawRequest: unknown): StoredRecord => {
    const request = RecordWriteRequestSchema.parse(rawRequest);
    const existing = this.#find(request.record.recordId);
    if (existing && existing.status !== 'Draft') {
      throw new Error('Finalized and cancelled records are read-only.');
    }
    const record = this.#buildRecord(request, existing, 'Draft', null);
    this.#write(record);
    return record;
  };

  public finalize = (rawRequest: unknown): StoredRecord => {
    const request = RecordWriteRequestSchema.parse(rawRequest);
    const existing = this.#find(request.record.recordId);
    if (existing?.status !== 'Draft') {
      throw new Error('Save the current document as a Draft before finalizing it.');
    }

    this.#database.exec('BEGIN IMMEDIATE;');
    try {
      const sequence = this.#database
        .prepare("SELECT next_value FROM app_sequences WHERE sequence_id = 'GST';")
        .get();
      const nextValue = Number(sequence?.next_value ?? 1);
      const documentNumber = `GST-${String(nextValue).padStart(6, '0')}`;
      this.#database
        .prepare("UPDATE app_sequences SET next_value = ? WHERE sequence_id = 'GST';")
        .run(nextValue + 1);
      const record = this.#buildRecord(request, existing, 'Finalized', documentNumber);
      this.#write(record);
      this.#database.exec('COMMIT;');
      return record;
    } catch (error) {
      this.#database.exec('ROLLBACK;');
      throw error;
    }
  };

  public cancel = (rawRequest: unknown): StoredRecord => {
    const request = RecordCancelRequestSchema.parse(rawRequest);
    if (request.operatorContext.role === 'User') {
      throw new Error('Only Admin or SysAdmin can cancel finalized records.');
    }
    const existing = this.#find(request.recordId);
    if (existing?.status !== 'Finalized') {
      throw new Error('Only finalized records can be cancelled.');
    }
    const record = StoredRecordSchema.parse({
      ...existing,
      status: 'Cancelled',
      cancellationReason: request.reason,
      updatedAt: new Date().toISOString(),
    });
    this.#write(record);
    return record;
  };

  public close = () => {
    this.#database.close();
  };

  #find = (recordId: string): StoredRecord | undefined => {
    const row = this.#database
      .prepare('SELECT record_json FROM app_records WHERE record_id = ?;')
      .get(recordId);
    return row ? StoredRecordSchema.parse(JSON.parse(String(row.record_json))) : undefined;
  };

  #write = (record: StoredRecord) => {
    this.#database
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

  #buildRecord = (
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
}
