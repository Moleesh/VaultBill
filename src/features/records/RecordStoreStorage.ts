/** @format */

import { demoSeedRecords } from './RecordStoreDemoSeed';
import { AppRecordSchema, type AppRecord, type EditableRecord } from './RecordStoreSchema';
import type { OperatorContext } from '../auth/AccountTypes';

/**
 * In-memory helpers for the browser-only demo records store.
 */

/** Custom event name fired when browser records change. */
export const recordStoreEventName = 'vaultbill-record-store-change';

let browserRecordsCache: readonly AppRecord[] | undefined;
let browserSequenceValue = 5;

/** Sorts records with the newest activity first. */
export const sortLatestFirst = (records: readonly AppRecord[]): readonly AppRecord[] =>
    [...records].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

const cloneRecords = (records: readonly AppRecord[]): readonly AppRecord[] =>
    JSON.parse(JSON.stringify(records)) as readonly AppRecord[];

/** Reads browser records from the in-memory demo store. */
export const readBrowserRecords = (seedDemo: boolean): readonly AppRecord[] => {
    browserRecordsCache ??= sortLatestFirst(cloneRecords(seedDemo ? demoSeedRecords : []));

    return browserRecordsCache;
};

/** Persists browser-backed demo records in memory for the active session. */
export const writeBrowserRecords = (records: readonly AppRecord[]) => {
    browserRecordsCache = sortLatestFirst(cloneRecords(records));
    window.dispatchEvent(new Event(recordStoreEventName));
};

/** Returns the next browser-side document number and increments the counter. */
export const nextDocumentNumber = (): string => {
    const next = browserSequenceValue;
    browserSequenceValue += 1;
    return `GST-${String(next).padStart(6, '0')}`;
};

/** Resets the browser-only demo dataset for the current session. */
export const resetBrowserRecords = () => {
    browserSequenceValue = 5;
    writeBrowserRecords(demoSeedRecords);
};

/** Builds a stored record structure from a browser record and metadata. */
export const buildStoredRecord = (
    input: EditableRecord,
    operatorContext: OperatorContext,
    existing: AppRecord | undefined,
    status: AppRecord['status'],
): AppRecord => {
    const now = new Date().toISOString();

    return AppRecordSchema.parse({
        ...input,
        documentNumber:
            status === 'Finalized' ? (existing?.documentNumber ?? nextDocumentNumber()) : null,
        status,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        createdBy: existing?.createdBy ?? operatorContext.CreatedBy,
        createdByName: existing?.createdByName ?? operatorContext.CreatedByName,
        lastActionAt: now,
        lastActionBy: operatorContext.LastActionBy,
        lastActionByName: operatorContext.LastActionByName,
    });
};
