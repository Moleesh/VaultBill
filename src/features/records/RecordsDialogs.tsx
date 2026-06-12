/** @format */

import type { FC } from 'react';

import { AppConfirmDialog } from '../../components/AppConfirmDialog/AppConfirmDialog';
import { AppModal } from '../../components/AppModal/AppModal';
import type { OutputTask } from './RecordsPageOutputTypes';

type RecordsDialogsProps = {
    readonly cancelReason: string;
    readonly isCancelOpen: boolean;
    readonly isFinalizeOpen: boolean;
    readonly onCancelReasonChange: (value: string) => void;
    readonly onCloseCancel: () => void;
    readonly onCloseFinalize: () => void;
    readonly onCloseOutput: () => void;
    readonly onConfirmFinalize: () => void;
    readonly onConfirmRecordCancel: () => void;
    readonly onCancelOutput: () => void;
    readonly outputTask: OutputTask | undefined;
};

/** Renders the finalize, cancel, and output dialogs for the record workflow. */
export const RecordsDialogs: FC<RecordsDialogsProps> = ({
    cancelReason,
    isCancelOpen,
    isFinalizeOpen,
    onCloseCancel,
    onCloseFinalize,
    onCloseOutput,
    onConfirmFinalize,
    onConfirmRecordCancel,
    onCancelOutput,
    onCancelReasonChange,
    outputTask,
}) => (
    <>
        <AppConfirmDialog
            confirmLabel="Finalize"
            description="VaultBill will allocate the next document number and lock this record for editing."
            isOpen={isFinalizeOpen}
            onCancel={onCloseFinalize}
            onConfirm={onConfirmFinalize}
            title="Finalize this document?"
        />
        <AppModal isOpen={isCancelOpen} onClose={onCloseCancel} title="Cancel finalized record">
            <label>
                <span>Cancellation reason</span>
                <textarea
                    onChange={(event) => {
                        onCancelReasonChange(event.currentTarget.value);
                    }}
                    placeholder="Required audit reason"
                    value={cancelReason}
                />
            </label>
            <div className="popup-actions">
                <button onClick={onCloseCancel} type="button">
                    Keep record
                </button>
                <button
                    className="button-danger"
                    disabled={!cancelReason.trim()}
                    onClick={onConfirmRecordCancel}
                    type="button"
                >
                    Cancel record
                </button>
            </div>
        </AppModal>
        <AppModal
            isOpen={Boolean(outputTask)}
            onClose={() => {
                if (outputTask?.state !== 'Running') onCloseOutput();
            }}
            title={outputTask?.title ?? 'Document output'}
        >
            {outputTask ? (
                <div className="print-progress">
                    <div>
                        <strong>{outputTask.message}</strong>
                        <span>{outputTask.completed === outputTask.total ? '100%' : '0%'}</span>
                    </div>
                    <progress max={outputTask.total} value={outputTask.completed} />
                    <div className="popup-actions">
                        <button
                            onClick={() => {
                                if (outputTask.state !== 'Running') onCloseOutput();
                                else onCancelOutput();
                            }}
                            type="button"
                        >
                            {outputTask.state === 'Running' ? 'Cancel output' : 'Close'}
                        </button>
                    </div>
                </div>
            ) : null}
        </AppModal>
    </>
);
