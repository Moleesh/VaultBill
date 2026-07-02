/** @format */

import type { FC } from 'react';

import { ActionButton } from '../../components/ActionButton';
import { AppModal } from '../../components/AppModal/AppModal';
import { DialogActions } from '../../components/DialogActions';
import { FileSelectButton } from '../../components/FileSelectButton';
import { FormField } from '../../components/FormFields';

import type { ResetFormApi, RestoreFormApi } from './useSettingsBackupSection';

type SettingsDialogsProps = {
    readonly capabilities: {
        readonly isHostedWeb: boolean;
    };
    readonly busyAction: string;
    readonly restoreOpen: boolean;
    readonly restoreForm: RestoreFormApi;
    readonly resetOpen: boolean;
    readonly resetForm: ResetFormApi;
    readonly recoveryKey: string;
    readonly onCloseRestore: () => void;
    readonly onCloseReset: () => void;
    readonly onCloseRecoveryKey: () => void;
    readonly onSetRestoreFile: (file: File | undefined) => void;
    readonly onCopyRecoveryKey: () => void;
    readonly onRestoreBackup: () => void;
    readonly onResetApplication: () => void;
};

export const SettingsDialogs: FC<SettingsDialogsProps> = ({
    capabilities,
    busyAction,
    restoreOpen,
    restoreForm,
    resetOpen,
    resetForm,
    recoveryKey,
    onCloseRestore,
    onCloseReset,
    onCloseRecoveryKey,
    onSetRestoreFile,
    onCopyRecoveryKey,
    onRestoreBackup,
    onResetApplication,
}) => (
    <>
        <AppModal
            isOpen={restoreOpen}
            onClose={() => {
                if (!busyAction) onCloseRestore();
            }}
            title="Restore VaultBill backup"
        >
            <p>
                The backup is checked and staged before the current database is replaced. VaultBill
                restarts after a successful restore.
            </p>
            {capabilities.isHostedWeb ? (
                <FormField.Wrapper label="VaultBill backup ZIP">
                    <FileSelectButton
                        accept=".zip,application/zip"
                        className="button-file--wide"
                        onChange={(event) => {
                            onSetRestoreFile(event.currentTarget.files?.[0]);
                        }}
                    >
                        Choose backup ZIP
                    </FileSelectButton>
                </FormField.Wrapper>
            ) : null}
            <restoreForm.Field name="password">
                {(field) => (
                    <FormField.PasswordField
                        autoComplete="current-password"
                        label="Backup password"
                        onChange={(event) => {
                            field.handleChange(event.currentTarget.value);
                        }}
                        value={field.state.value}
                    />
                )}
            </restoreForm.Field>
            <restoreForm.Field name="recoveryKey">
                {(field) => (
                    <FormField.TextAreaField
                        label="Recovery key (optional)"
                        onChange={(event) => {
                            field.handleChange(event.currentTarget.value);
                        }}
                        value={field.state.value}
                    />
                )}
            </restoreForm.Field>
            <DialogActions>
                <ActionButton disabled={Boolean(busyAction)} onClick={onCloseRestore}>
                    Cancel
                </ActionButton>
                <ActionButton
                    disabled={Boolean(busyAction)}
                    onClick={onRestoreBackup}
                    variant="primary"
                >
                    Choose and restore
                </ActionButton>
            </DialogActions>
        </AppModal>
        <AppModal
            isOpen={resetOpen}
            onClose={() => {
                if (!busyAction) onCloseReset();
            }}
            title="Reset application data"
        >
            <p className="feedback-info">
                This permanently removes records, formats, operators, settings, trial time, and
                activation from this installation.
            </p>
            <resetForm.Field name="sysAdminPassword">
                {(field) => (
                    <FormField.PasswordField
                        autoComplete="current-password"
                        label="System Administrator password"
                        onChange={(event) => {
                            field.handleChange(event.currentTarget.value);
                        }}
                        value={field.state.value}
                    />
                )}
            </resetForm.Field>
            <resetForm.Field name="confirmation">
                {(field) => (
                    <FormField.TextField
                        label="Type RESET VAULTBILL"
                        onChange={(event) => {
                            field.handleChange(event.currentTarget.value);
                        }}
                        value={field.state.value}
                    />
                )}
            </resetForm.Field>
            <DialogActions>
                <ActionButton disabled={Boolean(busyAction)} onClick={onCloseReset}>
                    Keep my data
                </ActionButton>
                <ActionButton
                    disabled={
                        Boolean(busyAction) ||
                        !resetForm.state.values.sysAdminPassword ||
                        resetForm.state.values.confirmation !== 'RESET VAULTBILL'
                    }
                    onClick={onResetApplication}
                    variant="primary"
                >
                    Reset and restart
                </ActionButton>
            </DialogActions>
        </AppModal>
        <AppModal
            isOpen={Boolean(recoveryKey)}
            onClose={onCloseRecoveryKey}
            title="Save your recovery key"
        >
            <p>
                Store this key separately from the backup. It can restore the backup if its password
                is unavailable.
            </p>
            <FormField.TextAreaField
                aria-label="Backup recovery key"
                label="Recovery key"
                readOnly
                value={recoveryKey}
            />
            <ActionButton onClick={onCopyRecoveryKey} variant="primary">
                Copy recovery key
            </ActionButton>
        </AppModal>
        <AppModal
            isOpen={Boolean(busyAction)}
            onClose={() => undefined}
            title={busyAction || 'Working'}
        >
            <div className="print-progress" aria-live="polite">
                <strong>{busyAction}</strong>
                <progress aria-label={busyAction} />
                <p>Please keep VaultBill open while this operation completes.</p>
            </div>
        </AppModal>
    </>
);
