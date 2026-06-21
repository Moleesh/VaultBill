/** @format */

import { useForm } from '@tanstack/react-form';
import type { FC } from 'react';
import { useEffect } from 'react';

import { ActionButton } from '../../components/ActionButton';
import { AppConfirmDialog } from '../../components/AppConfirmDialog/AppConfirmDialog';
import { AppModal } from '../../components/AppModal/AppModal';
import { DialogActions } from '../../components/DialogActions';
import { FormField } from '../../components/FormFields';
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
}) => {
    const cancelForm = useForm({
        defaultValues: {
            cancelReason,
        },
    });

    useEffect(() => {
        cancelForm.setFieldValue('cancelReason', cancelReason);
    }, [cancelForm, cancelReason]);

    return (
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
                <cancelForm.Field name="cancelReason">
                    {(field) => (
                        <FormField.TextAreaField
                            label="Cancellation reason"
                            onChange={(event) => {
                                field.handleChange(event.currentTarget.value);
                                onCancelReasonChange(event.currentTarget.value);
                            }}
                            placeholder="Required audit reason"
                            value={field.state.value}
                        />
                    )}
                </cancelForm.Field>
                <DialogActions>
                    <ActionButton onClick={onCloseCancel}>Keep record</ActionButton>
                    <ActionButton
                        disabled={!cancelForm.state.values.cancelReason.trim()}
                        onClick={onConfirmRecordCancel}
                        variant="danger"
                    >
                        Cancel record
                    </ActionButton>
                </DialogActions>
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
                        <DialogActions>
                            <ActionButton
                                onClick={() => {
                                    if (outputTask.state !== 'Running') onCloseOutput();
                                    else onCancelOutput();
                                }}
                            >
                                {outputTask.state === 'Running' ? 'Cancel output' : 'Close'}
                            </ActionButton>
                        </DialogActions>
                    </div>
                ) : null}
            </AppModal>
        </>
    );
};
