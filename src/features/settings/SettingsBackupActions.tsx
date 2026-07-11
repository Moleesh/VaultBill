/** @format */

import type { FC } from 'react';

import { ArchiveRestore, HardDriveDownload, RotateCcw, ShieldCheck } from 'lucide-react';

import { ActionButton } from '../../components/ActionButton';
import { FormField } from '../../components/FormFields';
import { IconButton } from '../../components/IconButton';

import type { BackupActionFormApi } from './useSettingsBackupSection';

type SettingsBackupActionsProps = {
    readonly canBackup: boolean;
    readonly canRestore: boolean;
    readonly isSysAdmin: boolean;
    readonly encryptBackup: boolean;
    readonly busyAction: string;
    readonly form: BackupActionFormApi;
    readonly onEncryptBackupChange: (value: boolean) => void;
    readonly onCreateBackup: () => void;
    readonly onOpenRestore: () => void;
    readonly onChangeBackupPassword: () => void;
    readonly onOpenReset: () => void;
};

/** Renders the backup, restore, and reset control blocks. */
export const SettingsBackupActions: FC<SettingsBackupActionsProps> = ({
    canBackup,
    canRestore,
    isSysAdmin,
    encryptBackup,
    busyAction,
    form,
    onEncryptBackupChange,
    onCreateBackup,
    onOpenRestore,
    onChangeBackupPassword,
    onOpenReset,
}) => (
    <>
        <div className="settings-subsection">
            <div className="section-heading">
                <div>
                    <h3>Backup and restore</h3>
                    <p>Create a verified backup or restore one from a checked VaultBill archive.</p>
                </div>
                <ArchiveRestore aria-hidden="true" />
            </div>
            {canBackup || canRestore ? (
                <div className="settings-subsection-card settings-subsection-card--form settings-subsection-card--backup-panel">
                    {canBackup ? (
                        <div className="settings-subsection-actions settings-subsection-actions--backup">
                            <FormField.CheckboxField
                                checked={encryptBackup}
                                label="Encrypt backup"
                                onChange={(event) => {
                                    onEncryptBackupChange(event.currentTarget.checked);
                                }}
                            />
                            <div className="settings-subsection-actions settings-subsection-actions--row settings-subsection-actions--row-compact">
                                <IconButton
                                    disabled={Boolean(busyAction)}
                                    icon={<HardDriveDownload aria-hidden="true" size={18} />}
                                    onClick={onCreateBackup}
                                >
                                    Create backup
                                </IconButton>
                                {canRestore ? (
                                    <IconButton
                                        disabled={Boolean(busyAction)}
                                        icon={<ArchiveRestore aria-hidden="true" size={18} />}
                                        onClick={onOpenRestore}
                                    >
                                        Restore backup
                                    </IconButton>
                                ) : null}
                            </div>
                        </div>
                    ) : canRestore ? (
                        <div className="settings-subsection-actions settings-subsection-actions--row settings-subsection-actions--row-compact">
                            <IconButton
                                disabled={Boolean(busyAction)}
                                icon={<ArchiveRestore aria-hidden="true" size={18} />}
                                onClick={onOpenRestore}
                            >
                                Restore backup
                            </IconButton>
                        </div>
                    ) : null}
                </div>
            ) : null}
            {!encryptBackup && canBackup ? (
                <p className="field-note">
                    Unencrypted backups are available when you need them, but VaultBill recommends
                    encrypted backups for normal use.
                </p>
            ) : null}
        </div>
        <div className="settings-subsection">
            <div className="section-heading">
                <div>
                    <h3>Backup password</h3>
                    <p>
                        Encrypt new backups with a password protected by the desktop secure store.
                    </p>
                </div>
                <ShieldCheck aria-hidden="true" />
            </div>
            <div className="settings-subsection-card settings-subsection-card--form settings-subsection-card--backup-panel">
                <div className="operator-create operator-create--inline operator-create--backup-password">
                    <form.Field name="backupPassword">
                        {(field) => (
                            <FormField.PasswordField
                                autoComplete="new-password"
                                label="New backup password"
                                onChange={(event) => {
                                    field.handleChange(event.currentTarget.value);
                                }}
                                value={field.state.value}
                            />
                        )}
                    </form.Field>
                    <div className="operator-create-action">
                        <IconButton
                            disabled={Boolean(busyAction)}
                            icon={<ShieldCheck aria-hidden="true" size={18} />}
                            onClick={onChangeBackupPassword}
                        >
                            Update backup password
                        </IconButton>
                    </div>
                </div>
            </div>
        </div>
        {isSysAdmin ? (
            <div className="settings-subsection danger-zone">
                <div className="section-heading">
                    <div>
                        <h3>Reset application data</h3>
                        <p>
                            Remove all local business data, accounts, trial state, and activation.
                        </p>
                    </div>
                    <RotateCcw aria-hidden="true" />
                </div>
                <div className="settings-subsection-card settings-subsection-card--form settings-subsection-card--backup-panel">
                    <ActionButton disabled={Boolean(busyAction)} onClick={onOpenReset}>
                        Reset application data
                    </ActionButton>
                </div>
            </div>
        ) : null}
    </>
);
