/** @format */

import { z } from 'zod';

import { demoSeedRecords } from './RecordStoreDemoSeed';
import { AppRecordSchema } from './RecordStoreSchema';
import type { AppRecord, EditableRecord } from './RecordStoreSchema';
import type { OperatorContext } from '../auth/AccountTypes';

/**
 * Browser-storage keys and helpers for the demo records store.
 */

/** Primary storage key for browser-backed records. */
export const browserStorageKey = 'vaultbill.records';
/** Legacy storage key kept for browser data migrations. */
export const legacyBrowserStorageKey = 'vaultbill.records.v23';
/** Primary storage key for the record sequence counter. */
export const sequenceStorageKey = 'vaultbill.sequence';
/** Legacy storage key kept for sequence migrations. */
export const legacySequenceStorageKey = 'vaultbill.sequence.v24';
/** Custom event name fired when browser records change. */
export const recordStoreEventName = 'vaultbill-record-store-change';

/** Sorts records with the newest activity first. */
export const sortLatestFirst = (records: readonly AppRecord[]): readonly AppRecord[] =>
    [...records].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

/** Reads browser records from localStorage and optionally seeds demo data. */
export const readBrowserRecords = (seedDemo: boolean): readonly AppRecord[] => {
    const rawRecords =
        window.localStorage.getItem(browserStorageKey) ??
        window.localStorage.getItem(legacyBrowserStorageKey);

    if (!rawRecords) {
        return seedDemo ? demoSeedRecords : [];
    }

    const parsed = z.array(AppRecordSchema).safeParse(JSON.parse(rawRecords) as unknown);
    return parsed.success ? sortLatestFirst(parsed.data) : seedDemo ? demoSeedRecords : [];
};

/** Persists browser-backed records into localStorage. */
export const writeBrowserRecords = (records: readonly AppRecord[]) => {
    window.localStorage.setItem(browserStorageKey, JSON.stringify(records));
    window.dispatchEvent(new Event(recordStoreEventName));
};

/** Returns the next browser-side document number and increments the counter. */
export const nextDocumentNumber = (): string => {
    const current = Number.parseInt(
        window.localStorage.getItem(sequenceStorageKey) ??
            window.localStorage.getItem(legacySequenceStorageKey) ??
            '1',
        10,
    );
    const next = Number.isFinite(current) && current > 0 ? current : 1;
    window.localStorage.setItem(sequenceStorageKey, String(next + 1));
    return `GST-${String(next).padStart(6, '0')}`;
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
    });
};
