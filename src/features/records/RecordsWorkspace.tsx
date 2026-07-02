/** @format */

import type { FC, KeyboardEvent, RefObject } from 'react';

import { ActionBar, type RecordActionState } from '../../components/ActionBar';
import { ActionButton } from '../../components/ActionButton';
import { RecordsFormSection } from './RecordsFormSection';
import type { ConfiguredFieldDefinition } from './RecordsPageSupport';
import type { AppRecord, EditableRecord, RecordLineItem } from './RecordStoreContext';

type RecordsWorkspaceProps = {
    readonly activeTab: 'create' | 'reprint';
    readonly actionState: RecordActionState;
    readonly configuredDocumentFields: readonly ConfiguredFieldDefinition[];
    readonly configuredLineFields: readonly ConfiguredFieldDefinition[];
    readonly formRef: RefObject<HTMLDivElement | null>;
    readonly isReadOnly: boolean;
    readonly notice: string;
    readonly onAction: (actionId: string) => void;
    readonly onAddLineItem: () => void;
    readonly onBackToSearch: () => void;
    readonly onCancelFinalizeRecord: () => void;
    readonly onEntryNavigation: (event: KeyboardEvent<HTMLDivElement>) => void;
    readonly onRecordChange: (nextRecord: EditableRecord) => void;
    readonly onUpdateLineItem: (rowId: string, changes: Partial<RecordLineItem>) => void;
    readonly operationError: string;
    readonly printLabel: string;
    readonly record: EditableRecord;
    readonly recordTotals: {
        readonly subtotal: string;
        readonly taxTotal: string;
        readonly roundOff: string;
        readonly grandTotal: string;
    };
    readonly selectedStoredRecord: AppRecord | undefined;
    readonly showCancelButton: boolean;
    readonly showShortcuts: boolean;
    readonly statusLabel: string;
};

/** Renders the main record entry and action workspace. */
export const RecordsWorkspace: FC<RecordsWorkspaceProps> = ({
    activeTab,
    actionState,
    configuredDocumentFields,
    configuredLineFields,
    formRef,
    isReadOnly,
    notice,
    onAction,
    onAddLineItem,
    onBackToSearch,
    onCancelFinalizeRecord,
    onEntryNavigation,
    onRecordChange,
    onUpdateLineItem,
    operationError,
    printLabel,
    record,
    recordTotals,
    selectedStoredRecord,
    showCancelButton,
    showShortcuts,
    statusLabel,
}) => (
    <section className="record-workspace">
        {activeTab === 'reprint' ? (
            <ActionButton className="record-back-button" onClick={onBackToSearch}>
                ← Back to record search
            </ActionButton>
        ) : null}
        <div className="record-workspace-form" onKeyDown={onEntryNavigation} ref={formRef}>
            {statusLabel ? (
                <div className="record-status-row">
                    <span className="status-pill">{statusLabel}</span>
                    {selectedStoredRecord?.documentNumber ? (
                        <strong>{selectedStoredRecord.documentNumber}</strong>
                    ) : null}
                </div>
            ) : null}
            <RecordsFormSection
                configuredDocumentFields={configuredDocumentFields}
                configuredLineFields={configuredLineFields}
                isReadOnly={isReadOnly}
                onAddLineItem={onAddLineItem}
                onRecordChange={onRecordChange}
                onUpdateLineItem={onUpdateLineItem}
                record={record}
                recordTotals={recordTotals}
                selectedStoredRecord={selectedStoredRecord}
            />
        </div>
        {operationError ? <p className="feedback-error">{operationError}</p> : null}
        {notice ? (
            <p className="feedback-success" role="status">
                {notice}
            </p>
        ) : null}
        {showCancelButton ? (
            <ActionButton onClick={onCancelFinalizeRecord} variant="danger">
                Cancel finalized record
            </ActionButton>
        ) : null}
        <ActionBar
            onAction={onAction}
            printLabel={printLabel}
            showShortcuts={showShortcuts}
            state={actionState}
        />
        <p className="sr-only" id="record-action-status" role="status" />
    </section>
);
