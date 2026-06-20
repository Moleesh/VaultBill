/** @format */

import type { KeyboardEvent, SetStateAction } from 'react';

import {
    applyDocumentCalculations,
    calculateConfiguredLineItem,
    calculateItemAmount,
    toEditableRecord,
} from './RecordsPageSupport';
import type { RecordPrintPackage } from './RecordPrintHtml';
import type { AppRecord, EditableRecord, RecordLineItem } from './RecordStoreContext';
import type { OperatorContext } from '../auth/AccountTypes';

type ActionState = 'New' | 'DraftDirty' | 'DraftSaved' | 'Finalized' | 'Reprint';

/**
 * Updates the selected record line item and recalculates document totals in one pass.
 */
export const updateRecordLineItem = (
    record: EditableRecord,
    activeConfig: Parameters<typeof applyDocumentCalculations>[1],
    rowId: string,
    changes: Partial<RecordLineItem>,
    secretValues: Readonly<Record<string, string>> = {},
): EditableRecord => {
    const lineItems = record.lineItems.map((item) => {
        if (item.rowId !== rowId) return item;
        const nextItem = { ...item, ...changes };
        return calculateConfiguredLineItem(
            { ...nextItem, amount: calculateItemAmount(nextItem) },
            activeConfig,
            secretValues,
        );
    });
    const grandTotal = lineItems
        .reduce((total, item) => total + (Number.parseFloat(item.amount) || 0), 0)
        .toFixed(2);
    return applyDocumentCalculations(
        { ...record, lineItems, grandTotal },
        activeConfig,
        secretValues,
    );
};

/**
 * Moves focus between entry fields while preserving Enter and Shift+Enter keyboard flow.
 */
export const handleRecordEntryNavigation = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
        event.key !== 'Enter' ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLButtonElement
    ) {
        return;
    }
    const form = event.currentTarget;
    const focusable = [
        ...form.querySelectorAll<HTMLElement>(
            'input:not(:disabled):not([readonly]), textarea:not(:disabled):not([readonly]), button:not(:disabled)',
        ),
        ...document.querySelectorAll<HTMLElement>('.action-bar button:not(:disabled)'),
    ];
    const currentIndex = focusable.indexOf(event.target as HTMLElement);
    if (focusable.length === 0 || currentIndex < 0) return;
    const direction = event.shiftKey ? -1 : 1;
    const nextIndex = (currentIndex + direction + focusable.length) % focusable.length;
    event.preventDefault();
    focusable[nextIndex]?.focus();
};

/**
 * Routes the selected record into reprint mode and clears the search query.
 */
export const selectRecordForReprint = (
    selected: AppRecord,
    setRecord: (value: EditableRecord) => void,
    setActionState: (value: SetStateAction<ActionState>) => void,
    setSearchQuery: (value: string) => void,
) => {
    setRecord(toEditableRecord(selected));
    setActionState('Reprint');
    setSearchQuery('');
};

type RecordActionState = {
    readonly actionState: ActionState;
    readonly cancelReason: string;
    readonly operatorContext: OperatorContext | undefined;
    readonly record: EditableRecord;
    readonly activeConfig: Parameters<typeof applyDocumentCalculations>[1];
    readonly activePrintPackage: RecordPrintPackage | undefined;
    readonly capabilities: {
        readonly isHostedWeb: boolean;
    };
    readonly outputTask:
        | {
              readonly jobId: string;
              readonly title: string;
              readonly completed: number;
              readonly total: number;
              readonly message: string;
              readonly state: 'Running' | 'Complete' | 'Failed' | 'Cancelled';
          }
        | undefined;
    readonly outputTarget: string;
    readonly preferredPrinterName: string;
    readonly selectedStoredRecord: AppRecord | undefined;
    readonly secretValues: Readonly<Record<string, string>>;
    readonly setActionState: (value: SetStateAction<ActionState>) => void;
    readonly setCancelReason: (value: string) => void;
    readonly setIsCancelOpen: (value: boolean) => void;
    readonly setIsFinalizeOpen: (value: boolean) => void;
    readonly setNotice: (value: string) => void;
    readonly setOperationError: (value: string) => void;
    readonly setOutputTask: (
        value:
            | {
                  readonly jobId: string;
                  readonly title: string;
                  readonly completed: number;
                  readonly total: number;
                  readonly message: string;
                  readonly state: 'Running' | 'Complete' | 'Failed' | 'Cancelled';
              }
            | undefined,
    ) => void;
    readonly setRecord: (value: EditableRecord) => void;
    readonly setSearchQuery: (value: string) => void;
};

export const confirmFinalizeRecord = (
    state: Pick<
        RecordActionState,
        | 'operatorContext'
        | 'record'
        | 'setRecord'
        | 'setActionState'
        | 'setIsFinalizeOpen'
        | 'setNotice'
        | 'setOperationError'
    > & {
        readonly finalizeRecord: (
            record: EditableRecord,
            operatorContext: OperatorContext,
        ) => Promise<AppRecord>;
    },
) => {
    if (!state.operatorContext) return;
    void state
        .finalizeRecord(state.record, state.operatorContext)
        .then((finalized) => {
            state.setRecord(toEditableRecord(finalized));
            state.setActionState('Finalized');
            state.setIsFinalizeOpen(false);
            state.setNotice(`Document ${finalized.documentNumber ?? ''} finalized successfully.`);
        })
        .catch((reason: unknown) => {
            state.setOperationError(
                reason instanceof Error ? reason.message : 'Document could not be finalized.',
            );
            state.setIsFinalizeOpen(false);
        });
};

export const confirmCancelRecord = (
    state: Pick<
        RecordActionState,
        | 'operatorContext'
        | 'cancelReason'
        | 'record'
        | 'setIsCancelOpen'
        | 'setNotice'
        | 'setOperationError'
        | 'setRecord'
    > & {
        readonly cancelRecord: (
            recordId: string,
            reason: string,
            operatorContext: OperatorContext,
        ) => Promise<AppRecord>;
    },
) => {
    if (!state.operatorContext) return;
    void state
        .cancelRecord(state.record.recordId, state.cancelReason, state.operatorContext)
        .then((cancelled) => {
            state.setRecord(toEditableRecord(cancelled));
            state.setIsCancelOpen(false);
            state.setNotice('Record cancelled. It remains available for audit and reprint.');
        })
        .catch((reason: unknown) => {
            state.setOperationError(
                reason instanceof Error ? reason.message : 'Record could not be cancelled.',
            );
            state.setIsCancelOpen(false);
        });
};
