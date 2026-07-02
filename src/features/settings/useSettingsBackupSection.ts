/** @format */
/* eslint-disable max-lines */

import { useState } from 'react';

import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCapabilities } from '../../capability/CapabilityContext';
import { getRuntimeQueryScope, queryKeys } from '../../query/QueryKeys';
import {
    createRuntimeBackup,
    resetRuntimeApplicationData,
    restoreRuntimeBackup,
    updateRuntimeBackupPassword,
} from '../../query/RuntimeQueries';

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

const downloadBackupFile = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.URL.revokeObjectURL(url);
};

/** Holds backup, restore, and reset state while shared mutations own runtime writes. */
export const useSettingsBackupSection = () => {
    const capabilities = useCapabilities();
    const queryClient = useQueryClient();
    const runtimeScope = getRuntimeQueryScope(capabilities);
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

    const refreshBackupState = () =>
        Promise.all([
            queryClient.invalidateQueries({
                queryKey: queryKeys.securityRuntimeState(runtimeScope),
            }),
            queryClient.invalidateQueries({
                queryKey: ['runtime', runtimeScope, 'sysadmin-dashboard'],
            }),
        ]).then(() => undefined);

    const backupPasswordMutation = useMutation({
        mutationFn: ({
            backupPassword,
            remoteAuthorizationPassword,
        }: {
            readonly backupPassword: string;
            readonly remoteAuthorizationPassword: string;
        }) =>
            updateRuntimeBackupPassword({
                backupPassword,
                capabilities,
                remoteAuthorizationPassword,
            }),
        onSuccess: async () => {
            backupActionForm.setFieldValue('backupPassword', '');
            await refreshBackupState();
            setMessage('Backup password updated securely.');
        },
    });

    const createBackupMutation = useMutation({
        mutationFn: ({
            encryptBackup,
            remoteAuthorizationPassword,
        }: {
            readonly encryptBackup: boolean;
            readonly remoteAuthorizationPassword: string;
        }) =>
            createRuntimeBackup({
                capabilities,
                encryptBackup,
                remoteAuthorizationPassword,
            }),
        onSuccess: async (result) => {
            if (!result.success) {
                setMessage(result.warning ?? 'Backup creation cancelled.');
                return;
            }

            if (result.downloadBlob && result.downloadFileName) {
                downloadBackupFile(result.downloadBlob, result.downloadFileName);
            }

            setRecoveryKey(result.recoveryKey ?? '');
            setMessage(`Backup saved to ${result.filePath ?? 'the selected location'}.`);
            await refreshBackupState();
        },
    });

    const restoreBackupMutation = useMutation({
        mutationFn: ({
            remoteAuthorizationPassword,
            restoreFile,
            restorePassword,
            restoreRecoveryKey,
        }: {
            readonly remoteAuthorizationPassword: string;
            readonly restoreFile: File;
            readonly restorePassword: string;
            readonly restoreRecoveryKey: string;
        }) =>
            restoreRuntimeBackup({
                capabilities,
                remoteAuthorizationPassword,
                restoreFile,
                restorePassword,
                restoreRecoveryKey,
            }),
        onSuccess: () => {
            setMessage('Backup validated. VaultBill is restarting with the restored database.');
            setRestoreOpen(false);
            restoreForm.reset();
            setRestoreFile(undefined);
        },
    });

    const resetApplicationMutation = useMutation({
        mutationFn: ({
            resetConfirmation,
            resetSysAdminPassword,
        }: {
            readonly resetConfirmation: string;
            readonly resetSysAdminPassword: string;
        }) =>
            resetRuntimeApplicationData({
                capabilities,
                resetConfirmation,
                resetSysAdminPassword,
            }),
        onSuccess: () => {
            setMessage('VaultBill is restarting with a clean database.');
            setResetOpen(false);
            resetForm.reset();
        },
    });

    const changeBackupPassword = () => {
        const { backupPassword, remoteAuthorizationPassword } = backupActionForm.state.values;
        if (!backupPassword.trim()) {
            setMessage('Enter a new backup password.');
            return;
        }

        setBusyAction('Updating backup password');
        void backupPasswordMutation
            .mutateAsync({
                backupPassword,
                remoteAuthorizationPassword,
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
        if (!encryptBackup && !window.confirm('Create an unencrypted backup?')) {
            return;
        }

        setBusyAction('Creating verified backup');
        void createBackupMutation
            .mutateAsync({
                encryptBackup,
                remoteAuthorizationPassword,
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
        void restoreBackupMutation
            .mutateAsync({
                remoteAuthorizationPassword,
                restoreFile,
                restorePassword: password,
                restoreRecoveryKey: recoveryKey,
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
        void resetApplicationMutation
            .mutateAsync({
                resetConfirmation: confirmation,
                resetSysAdminPassword: sysAdminPassword,
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
