/** @format */
/* eslint-disable max-lines */

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import type { Role } from '../../types/AppTypes';
import { useCapabilities } from '../../capability/CapabilityContext';
import { requestHostedApi } from '../../runtime/HostedApi';
import type { OperatorAccount } from '../auth/AccountTypes';
import { useSession } from '../auth/SessionContext';
import { getRuntimeQueryScope, queryKeys } from '../../query/QueryKeys';
import { fetchSecurityRuntimeState, fetchWorkspaceSettings } from '../../query/RuntimeQueries';
import {
    getManageableSecurityAccounts,
    isDefaultCredentialsActive,
} from './SettingsSecuritySectionHelpers';
import {
    activateSecurityLicense,
    changeSecurityPassword,
    createSecurityOperator,
} from './SettingsSecuritySectionActions';
import {
    defaultHostedWebPort,
    useCreateSettingsActivationForm,
    type CredentialStatus,
    type TrialStatus,
} from './SettingsSecuritySectionStateSupport';
import {
    runHostedWebServerAction,
    saveHostedWebConfiguration,
    saveIncludeDraftsInReportsSetting,
} from './SettingsSecuritySectionRuntimeSupport';

export type { SettingsActivationFormApi } from './SettingsSecuritySectionStateSupport';

/** Holds runtime-backed security settings state and actions for the settings screen. */
export const useSettingsSecuritySectionState = () => {
    const capabilities = useCapabilities();
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
            void saveIncludeDraftsInReportsSetting({
                isHostedWeb: capabilities.isHostedWeb,
                value,
            }).catch((reason: unknown) => {
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
                activateDesktop: window.vaultBillDesktop?.activateLicense,
                activateHosted: (licenseKey) =>
                    requestHostedApi('/trial/activate', 'POST', { licenseKey }),
                setMessage,
            });
        },
        trialStatus,
    };
};
