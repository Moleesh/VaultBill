/** @format */

import type { Dispatch, SetStateAction } from 'react';

import { firstMissingRequiredField, toEditableRecord } from './RecordsPageSupport';
import {
    handleRecordEntryNavigation,
    selectRecordForReprint,
    updateRecordLineItem,
} from './RecordsPageActionsSupport';
import { useRecordsPageOutput } from './useRecordsPageOutput';
import type { AppRecord, EditableRecord } from './RecordStoreContext';
import type { OperatorContext } from '../auth/AccountTypes';
import type { RecordPrintPackage } from './RecordPrintHtml';

type RecordsPageState = {
    readonly actionState: 'New' | 'DraftDirty' | 'DraftSaved' | 'Finalized' | 'Reprint';
    readonly activeConfig: Parameters<typeof firstMissingRequiredField>[1];
    readonly activeTab: 'create' | 'reprint';
    readonly cancelRecord: (
        recordId: string,
        reason: string,
        operatorContext: OperatorContext,
    ) => Promise<AppRecord>;
    readonly cancelReason: string;
    readonly finalizeRecord: (
        record: EditableRecord,
        operatorContext: OperatorContext,
    ) => Promise<AppRecord>;
    readonly operatorContext: OperatorContext | undefined;
    readonly record: EditableRecord;
    readonly saveDraft: (
        record: EditableRecord,
        operatorContext: OperatorContext,
    ) => Promise<AppRecord>;
    readonly setActionState: Dispatch<SetStateAction<RecordsPageState['actionState']>>;
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
    readonly selectedStoredRecord: AppRecord | undefined;
    readonly searchQuery: string;
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
    readonly capabilities: {
        readonly isLanBrowser: boolean;
    };
    readonly activePrintPackage: RecordPrintPackage | undefined;
    readonly outputTarget: string;
    readonly preferredPrinterName: string;
};

/**
 * Builds the record page actions and keyboard helpers.
 */
export const useRecordsPageActions = (state: RecordsPageState) => {
    const { cancelOutput, closeOutput, printCurrentRecord } = useRecordsPageOutput({
        actionState: state.actionState,
        activePrintPackage: state.activePrintPackage,
        capabilities: state.capabilities,
        outputTask: state.outputTask,
        outputTarget: state.outputTarget,
        preferredPrinterName: state.preferredPrinterName,
        record: state.record,
        selectedStoredRecord: state.selectedStoredRecord,
        setNotice: state.setNotice,
        setOutputTask: state.setOutputTask,
    });

    const markChanged = (nextRecord: EditableRecord) => {
        state.setRecord(nextRecord);
        state.setActionState(state.actionState === 'DraftSaved' ? 'DraftDirty' : state.actionState);
    };

    const openCancel = () => {
        state.setIsCancelOpen(true);
    };

    const closeCancel = () => {
        state.setIsCancelOpen(false);
    };

    const openFinalize = () => {
        state.setIsFinalizeOpen(true);
    };

    const closeFinalize = () => {
        state.setIsFinalizeOpen(false);
    };

    const confirmFinalize = () => {
        if (!state.operatorContext) return;
        void state
            .finalizeRecord(state.record, state.operatorContext)
            .then((finalized) => {
                state.setRecord(toEditableRecord(finalized));
                state.setActionState('Finalized');
                state.setIsFinalizeOpen(false);
                state.setNotice(
                    `Document ${finalized.documentNumber ?? ''} finalized successfully.`,
                );
            })
            .catch((reason: unknown) => {
                state.setOperationError(
                    reason instanceof Error ? reason.message : 'Document could not be finalized.',
                );
                state.setIsFinalizeOpen(false);
            });
    };

    const confirmRecordCancel = () => {
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

    return {
        cancelOutput,
        closeCancel,
        closeFinalize,
        closeOutput,
        confirmFinalize,
        confirmRecordCancel,
        handleEntryNavigation: handleRecordEntryNavigation,
        markChanged,
        openCancel,
        openFinalize,
        runAction: (actionId: string) => {
            if (!state.operatorContext) return;
            state.setOperationError('');
            if (actionId === 'draft') {
                const missingField = firstMissingRequiredField(state.record, state.activeConfig);
                if (missingField) {
                    state.setOperationError(`${missingField} is required before saving a Draft.`);
                    return;
                }
                void state.saveDraft(state.record, state.operatorContext).then((saved) => {
                    state.setRecord(toEditableRecord(saved));
                    state.setActionState('DraftSaved');
                    state.setNotice('Draft saved. Draft Print and Finalize are now available.');
                });
                return;
            }
            if (actionId === 'draft-print') {
                printCurrentRecord('Draft Print');
                return;
            }
            if (actionId === 'finalize') {
                state.setIsFinalizeOpen(true);
                return;
            }
            printCurrentRecord(actionId === 'reprint' ? 'Reprint' : 'Print');
        },
        selectReprintRecord: (selected: AppRecord) => {
            selectRecordForReprint(
                selected,
                state.setRecord,
                state.setActionState,
                state.setSearchQuery,
            );
        },
        updateLineItem: (rowId: string, changes: Partial<EditableRecord['lineItems'][number]>) => {
            markChanged(updateRecordLineItem(state.record, state.activeConfig, rowId, changes));
        },
    };
};
