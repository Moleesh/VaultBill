/** @format */

// @vitest-environment node

import { afterEach, describe, expect, it } from 'vitest';

import type { SqliteConnection } from '../../../db/sqlite/SqliteConnection';
import { createOperatorContext } from '../../auth/AccountBootstrap';
import { finalizeDraftRecord, loadDocumentRecord, saveDraftRecord } from '../RecordRepository';
import {
    createDraft,
    createOtherUser,
    getDefaultFormat,
    getSampleAccount,
    laterNow,
    openStartedDatabase,
    sampleLineItems,
} from '../RecordRepositoryTestHarness';

let connection: SqliteConnection | undefined;

afterEach(() => {
    connection?.close();
    connection = undefined;
});

describe('RecordRepository draft and finalization flow', () => {
    it('saves a new draft without allocating a final document number', () => {
        const db = openStartedDatabase();
        connection = db;
        const draft = createDraft(db);

        expect(draft).toMatchObject({
            RecordId: 'Record_01',
            DocumentNumber: null,
            Status: 'Draft',
            CreatedBy: 'user_1',
            LastActionByName: 'Counter Operator',
        });
        expect(loadDocumentRecord(db, 'Record_01')?.Values.CustomerName).toBe('Sample Customer');
    });

    it('allows creator, Admin, and SysAdmin to edit drafts only', () => {
        const db = openStartedDatabase();
        connection = db;
        createDraft(db);
        const admin = getSampleAccount(1);

        expect(() =>
            saveDraftRecord(db, {
                recordId: 'Record_01',
                format: getDefaultFormat(db),
                values: { CustomerName: 'Blocked Customer' },
                lineItemSections: sampleLineItems(),
                operatorContext: createOperatorContext(createOtherUser()),
                nowIso: laterNow,
                recordIdFactory: () => 'Record_01',
            }),
        ).toThrow('Only the draft creator, Admin, or SysAdmin can edit this draft.');

        const edited = saveDraftRecord(db, {
            recordId: 'Record_01',
            format: getDefaultFormat(db),
            values: { CustomerName: 'Admin Edited' },
            lineItemSections: sampleLineItems(),
            operatorContext: createOperatorContext(admin),
            nowIso: laterNow,
            recordIdFactory: () => 'Record_01',
        });

        expect(edited.Values.CustomerName).toBe('Admin Edited');
        expect(edited.CreatedBy).toBe('user_1');
        expect(edited.LastActionBy).toBe('admin_1');
    });

    it('finalizes drafts transactionally with one sequence number per record', () => {
        const db = openStartedDatabase();
        connection = db;
        createDraft(db, 'Record_01');
        createDraft(db, 'Record_02');
        const user = getSampleAccount(2);

        const first = finalizeDraftRecord(db, {
            recordId: 'Record_01',
            operatorContext: createOperatorContext(user),
            nowIso: laterNow,
        });
        const second = finalizeDraftRecord(db, {
            recordId: 'Record_02',
            operatorContext: createOperatorContext(user),
            nowIso: laterNow,
        });

        expect(first.DocumentNumber).toBe('TaxInvoice-000001');
        expect(second.DocumentNumber).toBe('TaxInvoice-000002');
        expect(first.Status).toBe('Finalized');
    });
});
