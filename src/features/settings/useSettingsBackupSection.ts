/** @format */

import { useState } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import { createHostedBackup, requestHostedApi, restoreHostedBackup } from '../../runtime/HostedApi';
import type { BackupResult } from './SettingsBackupTypes';

/**
 * Owns backup, restore, and application reset state for the SysAdmin settings panel.
 */
export const useSettingsBackupSection = () => {
    const capabilities = useCapabilities();
    const [backupPassword, setBackupPassword] = useState('');
    const [encryptBackup, setEncryptBackup] = useState(true);
    const [restoreOpen, setRestoreOpen] = useState(false);
    const [restorePassword, setRestorePassword] = useState('');
    const [restoreRecoveryKey, setRestoreRecoveryKey] = useState('');
    const [restoreFile, setRestoreFile] = useState<File>();
    const [remoteAuthorizationPassword, setRemoteAuthorizationPassword] = useState('');
    const [resetOpen, setResetOpen] = useState(false);
    const [resetSysAdminPassword, setResetSysAdminPassword] = useState('');
    const [resetConfirmation, setResetConfirmation] = useState('');
    const [recoveryKey, setRecoveryKey] = useState('');
    const [busyAction, setBusyAction] = useState('');
    const [, setMessage] = useState('');

    const changeBackupPassword = () => {
        if (!backupPassword.trim()) {
            setMessage('Enter a new backup password.');
            return;
        }
        setBusyAction('Updating backup password');
        const updatePassword = window.vaultBillDesktop
            ? window.vaultBillDesktop.setBackupPassword(backupPassword)
            : capabilities.isLanBrowser
              ? requestHostedApi('/credentials/backup-password', 'POST', {
                    currentPassword: remoteAuthorizationPassword,
                    backupPassword,
                })
              : Promise.resolve();
        void updatePassword
            .then(() => {
                setBackupPassword('');
                setMessage('Backup password updated securely.');
            })
            .catch((reason: unknown) => {
                setMessage(
                    reason instanceof Error
                        ? reason.message
                        : 'Backup password could not be updated.',
                );
            })
            .finally(() => {
                setBusyAction('');
            });
    };

    const createBackup = () => {
        if (!encryptBackup && !window.confirm('Create an unencrypted backup?')) return;
        setBusyAction('Creating verified backup');
        const backupTask: Promise<BackupResult> = window.vaultBillDesktop
            ? window.vaultBillDesktop.createBackup({ encrypted: encryptBackup }).then((result) =>
                  result.cancelled
                      ? { success: false, warning: 'Backup creation cancelled.' }
                      : {
                            success: true,
                            ...(result.filePath ? { filePath: result.filePath } : {}),
                            ...(result.recoveryKey ? { recoveryKey: result.recoveryKey } : {}),
                        },
              )
            : createHostedBackup(encryptBackup, remoteAuthorizationPassword).then((result) => {
                  const url = window.URL.createObjectURL(result.blob);
                  const anchor = document.createElement('a');
                  anchor.href = url;
                  anchor.download = result.fileName;
                  anchor.click();
                  window.URL.revokeObjectURL(url);
                  return {
                      success: true,
                      filePath: result.fileName,
                      ...(result.recoveryKey ? { recoveryKey: result.recoveryKey } : {}),
                  };
              });
        void backupTask
            .then((result) => {
                if (!result.success) {
                    setMessage(result.warning ?? 'Backup creation cancelled.');
                    return;
                }
                setRecoveryKey(result.recoveryKey ?? '');
                setMessage(`Backup saved to ${result.filePath ?? 'the selected location'}.`);
            })
            .catch((reason: unknown) => {
                setMessage(
                    reason instanceof Error ? reason.message : 'Backup could not be created.',
                );
            })
            .finally(() => {
                setBusyAction('');
            });
    };

    const restoreBackup = () => {
        if (!restoreFile) {
            setMessage('Choose a VaultBill backup ZIP to restore.');
            return;
        }
        setBusyAction('Validating and restoring backup');
        const restoration = window.vaultBillDesktop
            ? window.vaultBillDesktop.restoreBackup({
                  ...(restorePassword ? { password: restorePassword } : {}),
                  ...(restoreRecoveryKey ? { recoveryKey: restoreRecoveryKey } : {}),
              })
            : restoreHostedBackup(restoreFile, {
                  ...(restorePassword ? { backupPassword: restorePassword } : {}),
                  ...(restoreRecoveryKey ? { recoveryKey: restoreRecoveryKey } : {}),
                  sysAdminPassword: remoteAuthorizationPassword,
              });
        void restoration
            .then(() => {
                setMessage('Backup validated. VaultBill is restarting with the restored database.');
                setRestoreOpen(false);
                setRestorePassword('');
                setRestoreRecoveryKey('');
                setRestoreFile(undefined);
            })
            .catch((reason: unknown) => {
                setMessage(
                    reason instanceof Error ? reason.message : 'Backup could not be restored.',
                );
            })
            .finally(() => {
                setBusyAction('');
            });
    };

    const resetApplication = () => {
        if (!resetSysAdminPassword.trim() || resetConfirmation !== 'RESET VAULTBILL') {
            setMessage('Enter the System Administrator password and confirmation text.');
            return;
        }
        setBusyAction('Resetting application data');
        const reset = window.vaultBillDesktop
            ? window.vaultBillDesktop.resetApplicationData({
                  password: resetSysAdminPassword,
                  confirmation: resetConfirmation,
              })
            : capabilities.isLanBrowser
              ? requestHostedApi('/application/reset', 'POST', {
                    currentPassword: resetSysAdminPassword,
                    confirmation: resetConfirmation,
                })
              : Promise.resolve();
        void reset
            .then(() => {
                setMessage('VaultBill is restarting with a clean database.');
                setResetOpen(false);
                setResetSysAdminPassword('');
                setResetConfirmation('');
            })
            .catch((reason: unknown) => {
                setMessage(
                    reason instanceof Error ? reason.message : 'VaultBill could not be reset.',
                );
                setResetOpen(true);
            })
            .finally(() => {
                setBusyAction('');
            });
    };

    return {
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
        restoreFile,
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
    };
};
