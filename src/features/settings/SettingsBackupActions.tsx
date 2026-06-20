/** @format */

import { ArchiveRestore, HardDriveDownload, RotateCcw, ShieldCheck } from 'lucide-react';
import type { FC } from 'react';

type SettingsBackupActionsProps = {
    readonly canBackup: boolean;
    readonly canRestore: boolean;
    readonly isSysAdmin: boolean;
    readonly isHostedWeb: boolean;
    readonly encryptBackup: boolean;
    readonly busyAction: string;
    readonly backupPassword: string;
    readonly remoteAuthorizationPassword: string;
    readonly onEncryptBackupChange: (value: boolean) => void;
    readonly onBackupPasswordChange: (value: string) => void;
    readonly onRemoteAuthorizationPasswordChange: (value: string) => void;
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
    isHostedWeb,
    encryptBackup,
    busyAction,
    backupPassword,
    remoteAuthorizationPassword,
    onEncryptBackupChange,
    onBackupPasswordChange,
    onRemoteAuthorizationPasswordChange,
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
            {canBackup ? (
                <div className="operator-create">
                    <label className="checkbox-field">
                        <input
                            checked={encryptBackup}
                            onChange={(event) => {
                                onEncryptBackupChange(event.currentTarget.checked);
                            }}
                            type="checkbox"
                        />
                        <span>Encrypt backup</span>
                    </label>
                    <button disabled={Boolean(busyAction)} onClick={onCreateBackup} type="button">
                        <HardDriveDownload aria-hidden="true" size={18} /> Create backup
                    </button>
                </div>
            ) : null}
            {isHostedWeb && (canBackup || canRestore) ? (
                <label>
                    <span>System Administrator password for host operations</span>
                    <input
                        autoComplete="current-password"
                        type="password"
                        value={remoteAuthorizationPassword}
                        onChange={(event) => {
                            onRemoteAuthorizationPasswordChange(event.currentTarget.value);
                        }}
                    />
                </label>
            ) : null}
            {canRestore ? (
                <button disabled={Boolean(busyAction)} onClick={onOpenRestore} type="button">
                    <ArchiveRestore aria-hidden="true" size={18} /> Restore backup
                </button>
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
            <div className="operator-create">
                <label>
                    <span>New backup password</span>
                    <input
                        autoComplete="new-password"
                        type="password"
                        value={backupPassword}
                        onChange={(event) => {
                            onBackupPasswordChange(event.currentTarget.value);
                        }}
                    />
                </label>
                <button
                    disabled={Boolean(busyAction)}
                    onClick={onChangeBackupPassword}
                    type="button"
                >
                    Update backup password
                </button>
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
                <button disabled={Boolean(busyAction)} onClick={onOpenReset} type="button">
                    Reset application data
                </button>
            </div>
        ) : null}
    </>
);
