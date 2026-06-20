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
        backupPassword,
        busyAction,
        capabilities,
        changeBackupPassword,
        createBackup,
        encryptBackup,
        recoveryKey,
        remoteAuthorizationPassword,
        resetApplication,
        resetConfirmation,
        resetOpen,
        resetSysAdminPassword,
        restoreBackup,
        restoreOpen,
        restorePassword,
        restoreRecoveryKey,
        setBackupPassword,
        setEncryptBackup,
        setRecoveryKey,
        setRemoteAuthorizationPassword,
        setResetConfirmation,
        setResetOpen,
        setResetSysAdminPassword,
        setRestoreFile,
        setRestoreOpen,
        setRestorePassword,
        setRestoreRecoveryKey,
    } = useSettingsBackupSection();

    return (
        <section className="settings-section" id="backup">
            <header>
                <p className="eyebrow">Backup</p>
                <h2>Backup workspace</h2>
            </header>
            <SettingsBackupActions
                backupPassword={backupPassword}
                busyAction={busyAction}
                canBackup={capabilities.canBackup}
                canRestore={capabilities.canRestore}
                encryptBackup={encryptBackup}
                isHostedWeb={capabilities.isHostedWeb}
                isSysAdmin={true}
                onBackupPasswordChange={setBackupPassword}
                onChangeBackupPassword={changeBackupPassword}
                onCreateBackup={createBackup}
                onEncryptBackupChange={setEncryptBackup}
                onOpenReset={() => {
                    setResetOpen(true);
                }}
                onOpenRestore={() => {
                    setRestoreOpen(true);
                }}
                onRemoteAuthorizationPasswordChange={setRemoteAuthorizationPassword}
                remoteAuthorizationPassword={remoteAuthorizationPassword}
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
                onSetResetConfirmation={setResetConfirmation}
                onSetResetSysAdminPassword={setResetSysAdminPassword}
                onSetRestoreFile={setRestoreFile}
                onSetRestorePassword={setRestorePassword}
                onSetRestoreRecoveryKey={setRestoreRecoveryKey}
                recoveryKey={recoveryKey}
                resetConfirmation={resetConfirmation}
                resetOpen={resetOpen}
                resetSysAdminPassword={resetSysAdminPassword}
                restoreOpen={restoreOpen}
                restorePassword={restorePassword}
                restoreRecoveryKey={restoreRecoveryKey}
            />
        </section>
    );
};
