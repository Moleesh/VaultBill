/** @format */

/**
 * Desktop record store that persists invoices, statuses, and trial state.
 */

import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

import {
    buildStoredRecord,
    createRecordStoreTables,
    getStoredRecord,
    getTrialSeconds,
    isActivated,
    listStoredRecords,
    parseReportQuery,
    parseStoredRecord,
    RecordCancelRequestSchema,
    RecordWriteRequestSchema,
    type ReportQueryResult,
    safeBufferEqual,
    type StoredRecord,
    type TrialStatus,
    writeRuntime,
    writeStoredRecord,
} from './RecordStoreSupport.js';
import { compareStoredReportRecordsBySorts } from './ReportQuerySorting.js';

export type {
    RecordCancelRequest,
    RecordWriteRequest,
    ReportQuery,
    ReportQueryResult,
    StoredRecord,
    TrialStatus,
} from './RecordStoreSupport.js';

/** Persists records, report queries, and trial state in the desktop SQLite database. */
export class DesktopRecordStore {
    readonly #database: DatabaseSync;
    readonly #licenseVerifier: string;
    #lastTrialCheckpoint = Date.now();

    public constructor(databasePath: string, licenseVerifier = '') {
        this.#database = new DatabaseSync(databasePath);
        this.#licenseVerifier = licenseVerifier;
        createRecordStoreTables(this.#database);
    }

    /** Adds elapsed runtime to the accumulated desktop trial clock. */
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

    /** Reports whether the build is activated and how much trial time remains. */
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

    /** Validates a license key against the packaged verifier and activates the workspace. */
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

    /** Clears activation and accumulated time so the workspace starts a fresh trial. */
    public resetTrial = (): TrialStatus => {
        this.#lastTrialCheckpoint = Date.now();
        writeRuntime(this.#database, 'trial_seconds', '0');
        writeRuntime(this.#database, 'activated', 'false');
        return this.getTrialStatus();
    };

    /** Lists all stored records ordered by most recent updates first. */
    public list = (): readonly StoredRecord[] => listStoredRecords(this.#database);

    /** Applies report filters and returns one paged result set. */
    public queryReport = (rawQuery: unknown): ReportQueryResult => {
        const query = parseReportQuery(rawQuery);
        const customer = query.customer.trim().toLocaleLowerCase();
        const invoiceNumber = query.invoiceNumber.trim().toLocaleLowerCase();
        const formatId = query.formatId?.trim();
        const reportFilters = query.reportFilters.filter((filter) => filter.value.trim());
        const reportSorts = query.sorts.length > 0 ? query.sorts : ['updatedAt:desc'];
        let records = this.list()
            .filter((record) => query.includeDraftsInReports || record.status !== 'Draft')
            .filter((record) => !formatId || record.formatId === formatId)
            .filter((record) => query.status === 'All' || record.status === query.status)
            .filter(
                (record) => !customer || record.customerName.toLocaleLowerCase().includes(customer),
            )
            .filter(
                (record) =>
                    !invoiceNumber ||
                    record.documentNumber?.toLocaleLowerCase().includes(invoiceNumber),
            )
            .filter((record) =>
                reportFilters.every((filter) => {
                    const normalizedValue = filter.value.trim().toLocaleLowerCase();
                    if (!normalizedValue) return true;
                    const fieldValue = this.#reportFieldValueFor(record, filter.field);
                    return fieldValue.toLocaleLowerCase().includes(normalizedValue);
                }),
            )
            .filter((record) => !query.fromDate || record.invoiceDate >= query.fromDate)
            .filter((record) => !query.toDate || record.invoiceDate <= query.toDate)
            .sort((left, right) => compareStoredReportRecordsBySorts(left, right, reportSorts));
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

    /** Maps one report filter field to its comparable stored record value. */
    #reportFieldValueFor = (record: StoredRecord, field: string): string => {
        if (field === 'documentNumber') return record.documentNumber ?? '';
        if (field === 'customerName') return record.customerName;
        if (field === 'gstin') return record.gstin;
        if (field === 'invoiceDate') return record.invoiceDate;
        if (field === 'status') return record.status;
        if (field === 'grandTotal') return record.grandTotal;
        if (field === 'updatedAt') return record.updatedAt;
        return '';
    };

    /** Saves or updates a draft record while finalized and cancelled records stay read-only. */
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

    /** Finalizes a draft record and allocates the next GST document number transactionally. */
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

    /** Cancels one finalized record when the operator role has permission. */
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

    /** Flushes the current trial checkpoint and closes the SQLite connection. */
    public close = () => {
        this.checkpointTrial();
        this.#database.close();
    };

    /** Returns whether the workspace has already been activated. */
    #isActivated = (): boolean => isActivated(this.#database);

    /** Loads one stored record from SQLite by id. */
    #find = (recordId: string): StoredRecord | undefined =>
        getStoredRecord(this.#database, recordId);
}
