/** @format */

import type { Dispatch, SetStateAction } from 'react';

import type { WorkspaceSettings } from '../../runtime/WorkspaceSettings';
import type { OperatorContext } from '../auth/AccountTypes';
import type { RecordPrintPackage } from './RecordPrintHtml';
import {
    confirmCancelRecord,
    confirmFinalizeRecord,
    handleRecordEntryNavigation,
    selectRecordForReprint,
    updateRecordLineItem,
} from './RecordsPageActionsSupport';
import { firstMissingRequiredField, toEditableRecord } from './RecordsPageSupport';
import type { AppRecord, EditableRecord } from './RecordStoreContext';

import { useRecordsPageOutput } from './useRecordsPageOutput';
import type { RecordsReprintSearchFormApi } from './useRecordsPageStateSupport';

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
    readonly secretValues: Readonly<Record<string, string>>;
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
    readonly selectedStoredRecord: AppRecord | undefined;
    readonly reprintSearchForm: RecordsReprintSearchFormApi;
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
        readonly isHostedWeb: boolean;
    };
    readonly activePrintPackage: RecordPrintPackage | undefined;
    readonly outputTarget: string;
    readonly preferredPrinterName: string;
    readonly workspaceSettings: Pick<WorkspaceSettings, 'companyName' | 'address' | 'gstin'>;
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
        workspaceSettings: state.workspaceSettings,
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

    return {
        cancelOutput,
        closeCancel,
        closeFinalize,
        closeOutput,
        confirmFinalize: () => {
            confirmFinalizeRecord({
                operatorContext: state.operatorContext,
                record: state.record,
                setActionState: state.setActionState,
                setIsFinalizeOpen: state.setIsFinalizeOpen,
                setNotice: state.setNotice,
                setOperationError: state.setOperationError,
                setRecord: state.setRecord,
                finalizeRecord: state.finalizeRecord,
            });
        },
        confirmRecordCancel: () => {
            confirmCancelRecord({
                cancelReason: state.cancelReason,
                operatorContext: state.operatorContext,
                record: state.record,
                setIsCancelOpen: state.setIsCancelOpen,
                setNotice: state.setNotice,
                setOperationError: state.setOperationError,
                setRecord: state.setRecord,
                cancelRecord: state.cancelRecord,
            });
        },
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
            selectRecordForReprint(selected, state.setRecord, state.setActionState, (value) => {
                state.reprintSearchForm.setFieldValue('searchQuery', value);
            });
        },
        updateLineItem: (rowId: string, changes: Partial<EditableRecord['lineItems'][number]>) => {
            markChanged(
                updateRecordLineItem(
                    state.record,
                    state.activeConfig,
                    rowId,
                    changes,
                    state.secretValues,
                ),
            );
        },
    };
};
