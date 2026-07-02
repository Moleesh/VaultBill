/** @format */
import { useState } from 'react';

import { useForm } from '@tanstack/react-form';

import { useCapabilities } from '../../capability/CapabilityContext';

import {
    buildBackupCreationTask,
    buildBackupPasswordUpdateTask,
    buildResetTask,
    buildRestoreTask,
} from './useSettingsBackupSectionSupport';
type BackupActionFormValues = {
    readonly backupPassword: string;
    readonly remoteAuthorizationPassword: string;
};
type RestoreFormValues = {
    readonly password: string;
    readonly recoveryKey: string;
};
type ResetFormValues = {
    readonly confirmation: string;
    readonly sysAdminPassword: string;
};

const useBackupActionForm = () =>
    useForm({
        defaultValues: {
            backupPassword: '',
            remoteAuthorizationPassword: '',
        } satisfies BackupActionFormValues,
    });
const useRestoreForm = () =>
    useForm({ defaultValues: { password: '', recoveryKey: '' } satisfies RestoreFormValues });
const useResetForm = () =>
    useForm({
        defaultValues: { confirmation: '', sysAdminPassword: '' } satisfies ResetFormValues,
    });

export type BackupActionFormApi = ReturnType<typeof useBackupActionForm>;
export type RestoreFormApi = ReturnType<typeof useRestoreForm>;
export type ResetFormApi = ReturnType<typeof useResetForm>;

export const useSettingsBackupSection = () => {
    const capabilities = useCapabilities();
    const [encryptBackup, setEncryptBackup] = useState(true);
    const [restoreOpen, setRestoreOpen] = useState(false);
    const [restoreFile, setRestoreFile] = useState<File>();
    const [resetOpen, setResetOpen] = useState(false);
    const [recoveryKey, setRecoveryKey] = useState('');
    const [busyAction, setBusyAction] = useState('');
    const [, setMessage] = useState('');
    const backupActionForm = useBackupActionForm();
    const restoreForm = useRestoreForm();
    const resetForm = useResetForm();

    const changeBackupPassword = () => {
        const { backupPassword, remoteAuthorizationPassword } = backupActionForm.state.values;
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
                backupActionForm.setFieldValue('backupPassword', '');
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
        const { remoteAuthorizationPassword } = backupActionForm.state.values;
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
        const { password, recoveryKey } = restoreForm.state.values;
        const { remoteAuthorizationPassword } = backupActionForm.state.values;
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
            password,
            recoveryKey,
            remoteAuthorizationPassword,
        )
            .then(() => {
                setMessage('Backup validated. VaultBill is restarting with the restored database.');
                setRestoreOpen(false);
                restoreForm.reset();
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
        const { confirmation, sysAdminPassword } = resetForm.state.values;
        if (!sysAdminPassword.trim() || confirmation !== 'RESET VAULTBILL') {
            setMessage('Enter the System Administrator password and confirmation text.');
            return;
        }
        setBusyAction('Resetting application data');
        void buildResetTask(
            {
                isHostedWeb: capabilities.isHostedWeb,
                desktopApi: window.vaultBillDesktop,
            },
            sysAdminPassword,
            confirmation,
        )
            .then(() => {
                setMessage('VaultBill is restarting with a clean database.');
                setResetOpen(false);
                resetForm.reset();
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
        restoreFile,
        restoreOpen,
        setEncryptBackup,
        setRecoveryKey,
        setResetOpen,
        setRestoreFile,
        setRestoreOpen,
    };
};
