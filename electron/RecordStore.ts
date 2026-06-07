import { DatabaseSync } from 'node:sqlite';
/* eslint-disable max-lines */
import { createHash, timingSafeEqual } from 'node:crypto';
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

export type StoredRecord = z.infer<typeof StoredRecordSchema>;
export type RecordWriteRequest = z.infer<typeof RecordWriteRequestSchema>;
export type RecordCancelRequest = z.infer<typeof RecordCancelRequestSchema>;
export type TrialStatus = {
  readonly isFullVersion: boolean;
  readonly isExpired: boolean;
  readonly accumulatedSeconds: number;
  readonly remainingSeconds: number;
};

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

export type ReportQuery = z.input<typeof ReportQuerySchema>;
export type ReportQueryResult = {
  readonly rows: readonly StoredRecord[];
  readonly total: number;
  readonly nextCursor?: string;
};

export class DesktopRecordStore {
  readonly #database: DatabaseSync;
  readonly #licenseVerifier: string;
  #lastTrialCheckpoint = Date.now();

  public constructor(databasePath: string, licenseVerifier = '') {
    this.#database = new DatabaseSync(databasePath);
    this.#licenseVerifier = licenseVerifier;
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
      CREATE TABLE IF NOT EXISTS app_runtime (
        runtime_key TEXT PRIMARY KEY,
        runtime_value TEXT NOT NULL
      );
      INSERT OR IGNORE INTO app_runtime (runtime_key, runtime_value) VALUES ('trial_seconds', '0');
      INSERT OR IGNORE INTO app_runtime (runtime_key, runtime_value) VALUES ('activated', 'false');
    `);
  }

  public checkpointTrial = (): TrialStatus => {
    const now = Date.now();
    const elapsedSeconds = Math.max(0, Math.floor((now - this.#lastTrialCheckpoint) / 1000));
    this.#lastTrialCheckpoint = now;
    if (!this.#isActivated() && elapsedSeconds > 0) {
      const accumulated = this.#trialSeconds() + elapsedSeconds;
      this.#writeRuntime('trial_seconds', String(accumulated));
    }
    return this.getTrialStatus();
  };

  public getTrialStatus = (): TrialStatus => {
    const accumulatedSeconds = this.#trialSeconds();
    const trialSeconds = 24 * 60 * 60;
    const isFullVersion = this.#isActivated();
    return {
      isFullVersion,
      isExpired: !isFullVersion && accumulatedSeconds >= trialSeconds,
      accumulatedSeconds,
      remainingSeconds: isFullVersion
        ? trialSeconds
        : Math.max(0, trialSeconds - accumulatedSeconds),
    };
  };

  public activateLicense = (licenseKey: string): TrialStatus => {
    if (!this.#licenseVerifier) throw new Error('This build does not contain a license verifier.');
    const supplied = createHash('sha256').update(licenseKey.trim()).digest('hex');
    const expected = Buffer.from(this.#licenseVerifier, 'hex');
    const actual = Buffer.from(supplied, 'hex');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      throw new Error('The license key is not valid for this build.');
    }
    this.#writeRuntime('activated', 'true');
    return this.getTrialStatus();
  };

  public list = (): readonly StoredRecord[] =>
    this.#database
      .prepare('SELECT record_json FROM app_records ORDER BY updated_at DESC;')
      .all()
      .map((row) => StoredRecordSchema.parse(JSON.parse(String(row.record_json))));

  public queryReport = (rawQuery: unknown): ReportQueryResult => {
    const query = ReportQuerySchema.parse(rawQuery);
    const customer = query.customer.trim().toLocaleLowerCase();
    const invoiceNumber = query.invoiceNumber.trim().toLocaleLowerCase();
    let records = this.list()
      .filter((record) => query.status === 'All' || record.status === query.status)
      .filter((record) => !customer || record.customerName.toLocaleLowerCase().includes(customer))
      .filter(
        (record) =>
          !invoiceNumber || record.documentNumber?.toLocaleLowerCase().includes(invoiceNumber),
      )
      .filter((record) => !query.fromDate || record.invoiceDate >= query.fromDate)
      .filter((record) => !query.toDate || record.invoiceDate <= query.toDate)
      .sort(
        (left, right) =>
          right.updatedAt.localeCompare(left.updatedAt) ||
          left.recordId.localeCompare(right.recordId),
      );
    if (query.preset === 'Last100') records = records.slice(0, 100);
    const total = records.length;
    const offset = Math.max(0, Number.parseInt(query.cursor ?? '0', 10) || 0);
    const rows = records.slice(offset, offset + query.limit);
    const nextOffset = offset + rows.length;
    return {
      rows,
      total,
      ...(nextOffset < total ? { nextCursor: String(nextOffset) } : {}),
    };
  };

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
    this.checkpointTrial();
    this.#database.close();
  };

  #trialSeconds = (): number => {
    const row = this.#database
      .prepare("SELECT runtime_value FROM app_runtime WHERE runtime_key = 'trial_seconds';")
      .get();
    return Number.parseInt(String(row?.runtime_value ?? '0'), 10) || 0;
  };

  #isActivated = (): boolean => {
    const row = this.#database
      .prepare("SELECT runtime_value FROM app_runtime WHERE runtime_key = 'activated';")
      .get();
    return String(row?.runtime_value ?? 'false') === 'true';
  };

  #writeRuntime = (key: string, value: string) => {
    this.#database
      .prepare(
        'INSERT INTO app_runtime (runtime_key, runtime_value) VALUES (?, ?) ON CONFLICT(runtime_key) DO UPDATE SET runtime_value = excluded.runtime_value;',
      )
      .run(key, value);
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
