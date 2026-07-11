/** @format */

import type { FC } from 'react';

import { SettingsBackupActions } from './SettingsBackupActions';
import { SettingsDialogs } from './SettingsDialogs';

import { useSettingsBackupSection } from './useSettingsBackupSection';

/**
 * Renders SysAdmin backup, restore, and reset controls.
 */
export const SettingsBackupSection: FC = () => {
    const {
        backupActionForm,
        busyAction,
        capabilities,
        changeBackupPassword,
        createBackup,
        encryptBackup,
        recoveryKey,
        resetForm,
        resetApplication,
        resetOpen,
        restoreForm,
        restoreBackup,
        restoreOpen,
        setEncryptBackup,
        setRecoveryKey,
        setResetOpen,
        setRestoreFile,
        setRestoreOpen,
    } = useSettingsBackupSection();

    return (
        <section className="settings-section" id="backup">
            <header>
                <p className="eyebrow">Backup</p>
                <h2>Backup workspace</h2>
            </header>
            <SettingsBackupActions
                busyAction={busyAction}
                canBackup={capabilities.canBackup}
                canRestore={capabilities.canRestore}
                encryptBackup={encryptBackup}
                form={backupActionForm}
                isSysAdmin={true}
                onChangeBackupPassword={changeBackupPassword}
                onCreateBackup={createBackup}
                onEncryptBackupChange={setEncryptBackup}
                onOpenReset={() => {
                    setResetOpen(true);
                }}
                onOpenRestore={() => {
                    setRestoreOpen(true);
                }}
            />
            <SettingsDialogs
                busyAction={busyAction}
                capabilities={{ isHostedWeb: capabilities.isHostedWeb }}
                onCloseRecoveryKey={() => {
                    setRecoveryKey('');
                }}
                onCloseReset={() => {
                    if (!busyAction) setResetOpen(false);
                }}
                onCloseRestore={() => {
                    if (!busyAction) setRestoreOpen(false);
                }}
                onCopyRecoveryKey={() => {
                    void navigator.clipboard.writeText(recoveryKey);
                }}
                onResetApplication={resetApplication}
                onRestoreBackup={restoreBackup}
                onSetRestoreFile={setRestoreFile}
                recoveryKey={recoveryKey}
                resetForm={resetForm}
                resetOpen={resetOpen}
                restoreForm={restoreForm}
                restoreOpen={restoreOpen}
            />
        </section>
    );
};
