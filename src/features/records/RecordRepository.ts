/** @format */

import type { SqliteConnection } from '../../db/sqlite/SqliteConnection';
import { DocumentRecordSchema, type DocumentRecord } from './DocumentRecordSchema';
import { parseRecordJsonRow } from './RecordJson';
import {
    assertCanCancelFinalized,
    assertCanFinalizeDraft,
    assertCanSaveDraft,
} from './RecordPermissions';
import type { CancelRecordInput, DraftRecordInput, FinalizeRecordInput } from './RecordTypes';
import { insertRecordRow, updateRecordRow } from './RecordRows';
import { runRecordTransaction } from './RecordTransactions';
import { allocateDocumentNumber } from './SequenceEngine';

export const loadDocumentRecord = (
    connection: SqliteConnection,
    recordId: string,
): DocumentRecord | undefined => {
    const row = connection.get('SELECT record_json FROM records WHERE record_id = ?;', [recordId]);

    return row ? parseRecordJsonRow(row) : undefined;
};

export const saveDraftRecord = (
    connection: SqliteConnection,
    input: DraftRecordInput,
): DocumentRecord =>
    runRecordTransaction(connection, () => {
        const existing = input.recordId
            ? loadDocumentRecord(connection, input.recordId)
            : undefined;
        assertCanSaveDraft(existing, input.operatorContext);
        const record = buildDraftRecord(input, existing);

        if (existing) {
            updateRecordRow(connection, record, input.nowIso);
        } else {
            insertRecordRow(connection, record, input.nowIso);
        }

        return record;
    });

export const finalizeDraftRecord = (
    connection: SqliteConnection,
    input: FinalizeRecordInput,
): DocumentRecord =>
    runRecordTransaction(connection, () => {
        const existing = requireDocumentRecord(connection, input.recordId);
        assertCanFinalizeDraft(existing, input.operatorContext);
        const documentNumber = allocateDocumentNumber(
            connection,
            existing.FormatId,
            existing.FormatName,
            input.nowIso,
        );
        const finalized = withLastAction(
            { ...existing, DocumentNumber: documentNumber, Status: 'Finalized' },
            input.operatorContext,
            input.nowIso,
        );

        updateRecordRow(connection, finalized, input.nowIso);
        return finalized;
    });

export const cancelFinalizedRecord = (
    connection: SqliteConnection,
    input: CancelRecordInput,
): DocumentRecord =>
    runRecordTransaction(connection, () => {
        const existing = requireDocumentRecord(connection, input.recordId);
        assertCanCancelFinalized(existing, input.operatorContext, input.reason);
        const cancelled = withLastAction(
            { ...existing, Status: 'Cancelled' },
            input.operatorContext,
            input.nowIso,
        );

        updateRecordRow(connection, cancelled, input.nowIso);
        updateCancellationColumns(connection, input);
        return cancelled;
    });

export const getRecordForReprint = (
    connection: SqliteConnection,
    recordId: string,
): DocumentRecord => {
    const record = requireDocumentRecord(connection, recordId);

    if (record.Status === 'Draft') {
        throw new Error('Only finalized or cancelled records can be reprinted.');
    }

    return record;
};

const buildDraftRecord = (
    input: DraftRecordInput,
    existing: DocumentRecord | undefined,
): DocumentRecord =>
    withLastAction(
        DocumentRecordSchema.parse({
            RecordId: existing?.RecordId ?? input.recordId ?? input.recordIdFactory(),
            FormatId: input.format.formatId,
            FormatName: input.format.formatName,
            DocumentNumber: existing?.DocumentNumber ?? null,
            Status: 'Draft',
            Values: { ...input.values },
            LineItemSections: input.lineItemSections,
            Attachments: existing?.Attachments ?? [],
            CreatedAt: existing?.CreatedAt ?? input.nowIso,
            CreatedBy: existing?.CreatedBy ?? input.operatorContext.CreatedBy,
            CreatedByName: existing?.CreatedByName ?? input.operatorContext.CreatedByName,
            LastActionAt: null,
            LastActionBy: null,
            LastActionByName: null,
        }),
        input.operatorContext,
        input.nowIso,
    );

const requireDocumentRecord = (connection: SqliteConnection, recordId: string): DocumentRecord => {
    const record = loadDocumentRecord(connection, recordId);

    if (!record) {
        throw new Error(`Record ${recordId} was not found.`);
    }

    return record;
};

const updateCancellationColumns = (connection: SqliteConnection, input: CancelRecordInput) => {
    connection.run(
        `UPDATE records
      SET cancelled_at = ?, cancelled_by = ?, cancelled_by_name = ?,
        cancelled_reason = ?
      WHERE record_id = ?;`,
        [
            input.nowIso,
            input.operatorContext.LastActionBy,
            input.operatorContext.LastActionByName,
            input.reason.trim(),
            input.recordId,
        ],
    );
};

const withLastAction = (
    record: DocumentRecord,
    operatorContext: DraftRecordInput['operatorContext'],
    nowIso: string,
): DocumentRecord =>
    DocumentRecordSchema.parse({
        ...record,
        LastActionAt: nowIso,
        LastActionBy: operatorContext.LastActionBy,
        LastActionByName: operatorContext.LastActionByName,
    });
