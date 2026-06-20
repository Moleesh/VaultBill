/** @format */

import { useState } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import {
    buildBackupCreationTask,
    buildBackupPasswordUpdateTask,
    buildResetTask,
    buildRestoreTask,
} from './useSettingsBackupSectionSupport';

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
        void buildBackupPasswordUpdateTask(
            {
                isHostedWeb: capabilities.isHostedWeb,
                desktopApi: window.vaultBillDesktop,
            },
            backupPassword,
            remoteAuthorizationPassword,
        )
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
        void buildBackupCreationTask(
            {
                isHostedWeb: capabilities.isHostedWeb,
                desktopApi: window.vaultBillDesktop,
            },
            encryptBackup,
            remoteAuthorizationPassword,
        )
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
        void buildRestoreTask(
            {
                isHostedWeb: capabilities.isHostedWeb,
                desktopApi: window.vaultBillDesktop,
            },
            restoreFile,
            restorePassword,
            restoreRecoveryKey,
            remoteAuthorizationPassword,
        )
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
        void buildResetTask(
            {
                isHostedWeb: capabilities.isHostedWeb,
                desktopApi: window.vaultBillDesktop,
            },
            resetSysAdminPassword,
            resetConfirmation,
        )
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
