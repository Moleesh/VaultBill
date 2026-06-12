/** @format */

import type { FC } from 'react';

import { AppModal } from '../../components/AppModal/AppModal';

type SettingsDialogsProps = {
    readonly capabilities: {
        readonly isLanBrowser: boolean;
    };
    readonly busyAction: string;
    readonly restoreOpen: boolean;
    readonly restorePassword: string;
    readonly restoreRecoveryKey: string;
    readonly resetOpen: boolean;
    readonly resetSysAdminPassword: string;
    readonly resetConfirmation: string;
    readonly recoveryKey: string;
    readonly onCloseRestore: () => void;
    readonly onCloseReset: () => void;
    readonly onCloseRecoveryKey: () => void;
    readonly onSetRestoreFile: (file: File | undefined) => void;
    readonly onSetRestorePassword: (value: string) => void;
    readonly onSetRestoreRecoveryKey: (value: string) => void;
    readonly onSetResetSysAdminPassword: (value: string) => void;
    readonly onSetResetConfirmation: (value: string) => void;
    readonly onCopyRecoveryKey: () => void;
    readonly onRestoreBackup: () => void;
    readonly onResetApplication: () => void;
};

export const SettingsDialogs: FC<SettingsDialogsProps> = ({
    capabilities,
    busyAction,
    restoreOpen,
    restorePassword,
    restoreRecoveryKey,
    resetOpen,
    resetSysAdminPassword,
    resetConfirmation,
    recoveryKey,
    onCloseRestore,
    onCloseReset,
    onCloseRecoveryKey,
    onSetRestoreFile,
    onSetRestorePassword,
    onSetRestoreRecoveryKey,
    onSetResetSysAdminPassword,
    onSetResetConfirmation,
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
            {capabilities.isLanBrowser ? (
                <label>
                    <span>VaultBill backup ZIP</span>
                    <input
                        accept=".zip,application/zip"
                        onChange={(event) => {
                            onSetRestoreFile(event.currentTarget.files?.[0]);
                        }}
                        type="file"
                    />
                </label>
            ) : null}
            <label>
                <span>Backup password</span>
                <input
                    autoComplete="current-password"
                    type="password"
                    value={restorePassword}
                    onChange={(event) => {
                        onSetRestorePassword(event.currentTarget.value);
                    }}
                />
            </label>
            <label>
                <span>Recovery key (optional)</span>
                <textarea
                    value={restoreRecoveryKey}
                    onChange={(event) => {
                        onSetRestoreRecoveryKey(event.currentTarget.value);
                    }}
                />
            </label>
            <div className="popup-actions">
                <button disabled={Boolean(busyAction)} onClick={onCloseRestore} type="button">
                    Cancel
                </button>
                <button
                    className="button-primary"
                    disabled={Boolean(busyAction)}
                    onClick={onRestoreBackup}
                    type="button"
                >
                    Choose and restore
                </button>
            </div>
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
            <label>
                <span>System Administrator password</span>
                <input
                    autoComplete="current-password"
                    type="password"
                    value={resetSysAdminPassword}
                    onChange={(event) => {
                        onSetResetSysAdminPassword(event.currentTarget.value);
                    }}
                />
            </label>
            <label>
                <span>Type RESET VAULTBILL</span>
                <input
                    value={resetConfirmation}
                    onChange={(event) => {
                        onSetResetConfirmation(event.currentTarget.value);
                    }}
                />
            </label>
            <div className="popup-actions">
                <button disabled={Boolean(busyAction)} onClick={onCloseReset} type="button">
                    Keep my data
                </button>
                <button
                    className="button-primary"
                    disabled={
                        Boolean(busyAction) ||
                        !resetSysAdminPassword ||
                        resetConfirmation !== 'RESET VAULTBILL'
                    }
                    onClick={onResetApplication}
                    type="button"
                >
                    Reset and restart
                </button>
            </div>
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
            <textarea aria-label="Backup recovery key" readOnly value={recoveryKey} />
            <button className="button-primary" onClick={onCopyRecoveryKey} type="button">
                Copy recovery key
            </button>
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
