/** @format */
/* eslint-disable max-lines */

import { useEffect, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useCapabilities } from '../../capability/CapabilityContext';
import { getRuntimeQueryScope, queryKeys } from '../../query/QueryKeys';
import {
    activateRuntimeLicense,
    fetchSecurityRuntimeState,
    fetchWorkspaceSettings,
    saveIncludeDraftsInReports,
} from '../../query/RuntimeQueries';
import type { Role } from '../../types/AppTypes';
import type { OperatorAccount } from '../auth/AccountTypes';
import { useSession } from '../auth/SessionContext';
import {
    activateSecurityLicense,
    changeSecurityPassword,
    createSecurityOperator,
} from './SettingsSecuritySectionActions';
import {
    getManageableSecurityAccounts,
    isDefaultCredentialsActive,
} from './SettingsSecuritySectionHelpers';
import {
    runHostedWebServerAction,
    saveHostedWebConfiguration,
} from './SettingsSecuritySectionRuntimeSupport';
import {
    defaultHostedWebPort,
    useCreateSettingsActivationForm,
    type CredentialStatus,
    type TrialStatus,
} from './SettingsSecuritySectionStateSupport';

export type { SettingsActivationFormApi } from './SettingsSecuritySectionStateSupport';

/** Holds runtime-backed security settings state and actions for the settings screen. */
export const useSettingsSecuritySectionState = () => {
    const capabilities = useCapabilities();
    const queryClient = useQueryClient();
    const runtimeScope = getRuntimeQueryScope(capabilities);
    const { accounts, archiveAccount, operatorContext, resetPassword, saveAccount } = useSession();
    const [lanEnabled, setLanEnabled] = useState(false);
    const [hostedWebAutoStart, setHostedWebAutoStart] = useState(true);
    const [hostedWebServerRunning, setHostedWebServerRunning] = useState(false);
    const [trialStatus, setTrialStatus] = useState<TrialStatus>();
    const [credentialStatus, setCredentialStatus] = useState<CredentialStatus>();
    const [message, setMessage] = useState('');
    const [includeDraftsInReports, setIncludeDraftsInReports] = useState(false);
    const activationForm = useCreateSettingsActivationForm();
    const securityRuntimeQuery = useQuery({
        queryKey: queryKeys.securityRuntimeState(runtimeScope),
        queryFn: () => fetchSecurityRuntimeState({ capabilities }),
    });
    const workspaceSettingsQuery = useQuery({
        queryKey: queryKeys.workspaceSettings(runtimeScope),
        queryFn: () => fetchWorkspaceSettings({ capabilities }),
    });
    const activateLicenseMutation = useMutation({
        mutationFn: (licenseKey: string) =>
            activateRuntimeLicense({
                capabilities,
                licenseKey,
            }),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: queryKeys.securityRuntimeState(runtimeScope),
                }),
                queryClient.invalidateQueries({
                    queryKey: queryKeys.trialStatus(
                        runtimeScope,
                        operatorContext?.account.userId ?? 'guest',
                    ),
                }),
            ]);
        },
    });
    const saveIncludeDraftsMutation = useMutation({
        mutationFn: (value: boolean) =>
            saveIncludeDraftsInReports({
                capabilities,
                value,
            }),
        onSuccess: async (nextSettings) => {
            queryClient.setQueryData(queryKeys.workspaceSettings(runtimeScope), nextSettings);
            await queryClient.invalidateQueries({
                queryKey: queryKeys.workspaceSettings(runtimeScope),
            });
        },
    });

    useEffect(() => {
        if (securityRuntimeQuery.data) {
            setCredentialStatus(securityRuntimeQuery.data.credentialStatus);
            setLanEnabled(securityRuntimeQuery.data.lanEnabled);
            setHostedWebAutoStart(securityRuntimeQuery.data.hostedWebAutoStart);
            setHostedWebServerRunning(securityRuntimeQuery.data.hostedWebServerRunning);
            setTrialStatus(securityRuntimeQuery.data.trialStatus);
            return;
        }
        if (securityRuntimeQuery.isError) {
            setCredentialStatus(undefined);
            setLanEnabled(false);
            setHostedWebAutoStart(true);
            setHostedWebServerRunning(false);
            setTrialStatus(undefined);
        }
    }, [securityRuntimeQuery.data, securityRuntimeQuery.isError]);

    useEffect(() => {
        if (workspaceSettingsQuery.data) {
            setIncludeDraftsInReports(workspaceSettingsQuery.data.includeDraftsInReports);
            return;
        }
        if (workspaceSettingsQuery.isError) {
            setIncludeDraftsInReports(false);
        }
    }, [workspaceSettingsQuery.data, workspaceSettingsQuery.isError]);

    return {
        activeUserCount: accounts.filter((account) => account.role === 'User' && account.isActive)
            .length,
        archiveAccount,
        canLanServer: capabilities.canLanServer,
        createOperator: (input: {
            readonly username: string;
            readonly displayName: string;
            readonly password: string;
            readonly role: Role;
        }) =>
            createSecurityOperator({
                displayName: input.displayName,
                password: input.password,
                role: input.role,
                saveAccount,
                setMessage,
                username: input.username,
            }),
        defaultCredentialsActive: isDefaultCredentialsActive(
            credentialStatus?.sysAdminUsesDefaultPassword,
            credentialStatus?.backupUsesDefaultPassword,
        ),
        hostedWebAutoStart,
        hostedWebServerRunning,
        activationForm,
        isDemoMode: capabilities.isDemoMode,
        includeDraftsInReports,
        lanEnabled,
        manageableAccounts: getManageableSecurityAccounts(
            accounts,
            operatorContext?.role ?? 'User',
        ),
        message,
        onChangePassword: (input: { readonly password: string; readonly userId: string }) => {
            void changeSecurityPassword({
                password: input.password,
                resetPassword,
                setMessage,
                userId: input.userId,
            });
        },
        onLanEnabledChange: (value: boolean) => {
            setLanEnabled(value);
            void saveHostedWebConfiguration({
                autoStart: hostedWebAutoStart,
                desktopBridge: window.vaultBillDesktop,
                lanEnabled: value,
                port: defaultHostedWebPort,
            });
        },
        onHostedWebAutoStartChange: (value: boolean) => {
            setHostedWebAutoStart(value);
            void saveHostedWebConfiguration({
                autoStart: value,
                desktopBridge: window.vaultBillDesktop,
                lanEnabled,
                port: defaultHostedWebPort,
            })
                .then(() => {
                    setMessage(
                        value
                            ? 'Hosted web will start automatically when VaultBill opens.'
                            : 'Hosted web will stay stopped on launch until a System Administrator starts it.',
                    );
                })
                .catch((reason: unknown) => {
                    setHostedWebAutoStart(!value);
                    setMessage(
                        reason instanceof Error
                            ? reason.message
                            : 'Could not update the hosted web startup setting.',
                    );
                });
        },
        onStartHostedWebServer: () => {
            void runHostedWebServerAction('startHostedWebServer', window.vaultBillDesktop)
                .then((isRunning) => {
                    setHostedWebServerRunning(isRunning);
                    setMessage('Hosted web started.');
                })
                .catch((reason: unknown) => {
                    setMessage(
                        reason instanceof Error ? reason.message : 'Could not start hosted web.',
                    );
                });
        },
        onStopHostedWebServer: () => {
            void runHostedWebServerAction('stopHostedWebServer', window.vaultBillDesktop)
                .then((isRunning) => {
                    setHostedWebServerRunning(isRunning);
                    setMessage('Hosted web stopped.');
                })
                .catch((reason: unknown) => {
                    setMessage(
                        reason instanceof Error ? reason.message : 'Could not stop hosted web.',
                    );
                });
        },
        onRestartHostedWebServer: () => {
            void runHostedWebServerAction('restartHostedWebServer', window.vaultBillDesktop)
                .then((isRunning) => {
                    setHostedWebServerRunning(isRunning);
                    setMessage('Hosted web restarted.');
                })
                .catch((reason: unknown) => {
                    setMessage(
                        reason instanceof Error ? reason.message : 'Could not restart hosted web.',
                    );
                });
        },
        onIncludeDraftsInReportsChange: (value: boolean) => {
            const previousValue = includeDraftsInReports;
            setIncludeDraftsInReports(value);
            void saveIncludeDraftsMutation.mutateAsync(value).catch((reason: unknown) => {
                setIncludeDraftsInReports(previousValue);
                setMessage(
                    reason instanceof Error ? reason.message : 'Could not save the report setting.',
                );
            });
        },
        onSetAccountActive: (account: OperatorAccount, isActive: boolean) => {
            void saveAccount({ ...account, isActive });
        },
        operatorContext,
        operatorRole: operatorContext?.role ?? 'User',
        onActivateLicense: () => {
            activateSecurityLicense({
                activationForm,
                activate: (licenseKey) => activateLicenseMutation.mutateAsync(licenseKey),
                setMessage,
            });
        },
        trialStatus,
    };
};
