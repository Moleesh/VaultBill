/** @format */

// @vitest-environment node

import { afterEach, describe, expect, it } from 'vitest';

import type { SqliteConnection } from '../../../db/sqlite/SqliteConnection';
import { createOperatorContext } from '../../auth/AccountBootstrap';
import {
    cancelFinalizedRecord,
    finalizeDraftRecord,
    getRecordForReprint,
} from '../RecordRepository';
import {
    createDraft,
    getSampleAccount,
    laterNow,
    openStartedDatabase,
} from '../RecordRepositoryTestHarness';

let connection: SqliteConnection | undefined;

afterEach(() => {
    connection?.close();
    connection = undefined;
});

describe('RecordRepository cancellation and reprint flow', () => {
    it('prevents finalized record edits and draft reprints', () => {
        const db = openStartedDatabase();
        connection = db;
        createDraft(db);
        const user = getSampleAccount(2);

        finalizeDraftRecord(db, {
            recordId: 'Record_01',
            operatorContext: createOperatorContext(user),
            nowIso: laterNow,
        });

        expect(() => createDraft(db)).toThrow(
            'Only the draft creator, Admin, or SysAdmin can edit this draft.',
        );
        expect(getRecordForReprint(db, 'Record_01').Status).toBe('Finalized');

        createDraft(db, 'Record_02');
        expect(() => getRecordForReprint(db, 'Record_02')).toThrow(
            'Only finalized or cancelled records can be reprinted.',
        );
    });

    it('allows only Admin to cancel finalized records with a reason', () => {
        const db = openStartedDatabase();
        connection = db;
        createDraft(db);
        const user = getSampleAccount(2);
        const admin = getSampleAccount(1);

        finalizeDraftRecord(db, {
            recordId: 'Record_01',
            operatorContext: createOperatorContext(user),
            nowIso: laterNow,
        });

        expect(() =>
            cancelFinalizedRecord(db, {
                recordId: 'Record_01',
                reason: 'Incorrect customer',
                operatorContext: createOperatorContext(user),
                nowIso: laterNow,
            }),
        ).toThrow('Only Admin can cancel finalized records.');

        const cancelled = cancelFinalizedRecord(db, {
            recordId: 'Record_01',
            reason: 'Incorrect customer',
            operatorContext: createOperatorContext(admin),
            nowIso: laterNow,
        });

        expect(cancelled.Status).toBe('Cancelled');
        expect(getRecordForReprint(db, 'Record_01').Status).toBe('Cancelled');
        expect(
            db.get('SELECT cancelled_reason FROM records WHERE record_id = ?;', ['Record_01']),
        ).toEqual({ cancelled_reason: 'Incorrect customer' });
    });
});
