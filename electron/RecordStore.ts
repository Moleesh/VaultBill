/** @format */

/**
 * Desktop record store that persists invoices, statuses, and trial state.
 */

import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';

import {
    buildStoredRecord,
    createRecordStoreTables,
    getStoredRecord,
    getTrialSeconds,
    isActivated,
    listStoredRecords,
    parseReportQuery,
    parseStoredRecord,
    safeBufferEqual,
    RecordCancelRequestSchema,
    RecordWriteRequestSchema,
    type ReportQueryResult,
    type StoredRecord,
    type TrialStatus,
    writeRuntime,
    writeStoredRecord,
} from './RecordStoreSupport.js';

export type {
    RecordCancelRequest,
    ReportQuery,
    ReportQueryResult,
    RecordWriteRequest,
    StoredRecord,
    TrialStatus,
} from './RecordStoreSupport.js';

export class DesktopRecordStore {
    readonly #database: DatabaseSync;
    readonly #licenseVerifier: string;
    #lastTrialCheckpoint = Date.now();

    public constructor(databasePath: string, licenseVerifier = '') {
        this.#database = new DatabaseSync(databasePath);
        this.#licenseVerifier = licenseVerifier;
        createRecordStoreTables(this.#database);
    }

    public checkpointTrial = (): TrialStatus => {
        const now = Date.now();
        const elapsedSeconds = Math.max(0, Math.floor((now - this.#lastTrialCheckpoint) / 1000));
        this.#lastTrialCheckpoint = now;
        if (!this.#isActivated() && elapsedSeconds > 0) {
            writeRuntime(
                this.#database,
                'trial_seconds',
                String(getTrialSeconds(this.#database) + elapsedSeconds),
            );
        }
        return this.getTrialStatus();
    };

    public getTrialStatus = (): TrialStatus => {
        const accumulatedSeconds = getTrialSeconds(this.#database);
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
        if (!this.#licenseVerifier)
            throw new Error('This build does not contain a license verifier.');
        const supplied = createHash('sha256').update(licenseKey.trim()).digest('hex');
        if (!safeBufferEqual(this.#licenseVerifier, supplied)) {
            throw new Error('The license key is not valid for this build.');
        }
        writeRuntime(this.#database, 'activated', 'true');
        return this.getTrialStatus();
    };

    public list = (): readonly StoredRecord[] => listStoredRecords(this.#database);

    public queryReport = (rawQuery: unknown): ReportQueryResult => {
        const query = parseReportQuery(rawQuery);
        const customer = query.customer.trim().toLocaleLowerCase();
        const invoiceNumber = query.invoiceNumber.trim().toLocaleLowerCase();
        let records = this.list()
            .filter((record) => query.status === 'All' || record.status === query.status)
            .filter(
                (record) => !customer || record.customerName.toLocaleLowerCase().includes(customer),
            )
            .filter(
                (record) =>
                    !invoiceNumber ||
                    record.documentNumber?.toLocaleLowerCase().includes(invoiceNumber),
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
        return { rows, total, ...(nextOffset < total ? { nextCursor: String(nextOffset) } : {}) };
    };

    public saveDraft = (rawRequest: unknown): StoredRecord => {
        const request = RecordWriteRequestSchema.parse(rawRequest);
        const existing = this.#find(request.record.recordId);
        if (existing && existing.status !== 'Draft') {
            throw new Error('Finalized and cancelled records are read-only.');
        }
        const record = buildStoredRecord(request, existing, 'Draft', null);
        writeStoredRecord(this.#database, record);
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
            const record = buildStoredRecord(request, existing, 'Finalized', documentNumber);
            writeStoredRecord(this.#database, record);
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
        const record = parseStoredRecord({
            ...existing,
            status: 'Cancelled',
            cancellationReason: request.reason,
            updatedAt: new Date().toISOString(),
        });
        writeStoredRecord(this.#database, record);
        return record;
    };

    public close = () => {
        this.checkpointTrial();
        this.#database.close();
    };

    #isActivated = (): boolean => isActivated(this.#database);

    #find = (recordId: string): StoredRecord | undefined =>
        getStoredRecord(this.#database, recordId);
}
