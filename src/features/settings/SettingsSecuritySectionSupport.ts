/** @format */

import { useEffect, useState } from 'react';

import type { Role } from '../../types/AppTypes';
import { useCapabilities } from '../../capability/CapabilityContext';
import { requestHostedApi } from '../../runtime/HostedApi';
import { loadWorkspaceSettings } from '../../runtime/WorkspaceSettings';
import { defaultPasswordHash, hashPassword } from '../auth/SessionSupport';
import type { OperatorAccount } from '../auth/AccountTypes';
import { useSession } from '../auth/SessionContext';
import {
    getManageableSecurityAccounts,
    getOperatorCreationMessage,
    isDefaultCredentialsActive,
} from './SettingsSecuritySectionHelpers';
import {
    defaultHostedWebPort,
    loadSettingsSecurityRuntimeState,
    useCreateSettingsActivationForm,
    type CredentialStatus,
    type TrialStatus,
} from './SettingsSecuritySectionStateSupport';

export type { SettingsActivationFormApi } from './SettingsSecuritySectionStateSupport';

/** Holds runtime-backed security settings state and actions for the settings screen. */
export const useSettingsSecuritySectionState = () => {
    const capabilities = useCapabilities();
    const { accounts, archiveAccount, operatorContext, resetPassword, saveAccount } = useSession();
    const [lanEnabled, setLanEnabled] = useState(false);
    const [trialStatus, setTrialStatus] = useState<TrialStatus>();
    const [credentialStatus, setCredentialStatus] = useState<CredentialStatus>();
    const [message, setMessage] = useState('');
    const [includeDraftsInReports, setIncludeDraftsInReports] = useState(false);
    const activationForm = useCreateSettingsActivationForm();

    useEffect(() => {
        void loadSettingsSecurityRuntimeState(capabilities.isHostedWeb).then((runtimeState) => {
            setCredentialStatus(runtimeState.credentialStatus);
            setLanEnabled(runtimeState.lanEnabled);
            setTrialStatus(runtimeState.trialStatus);
        });
    }, [capabilities.isHostedWeb]);

    useEffect(() => {
        void loadWorkspaceSettings(capabilities.isHostedWeb).then((settings) => {
            setIncludeDraftsInReports(settings.includeDraftsInReports);
        });
    }, [capabilities.isHostedWeb]);

    const createOperator = async (input: {
        readonly username: string;
        readonly displayName: string;
        readonly password: string;
        readonly role: Role;
    }) => {
        const username = input.username.trim();
        const displayName = input.displayName.trim();
        if (!username || !displayName) {
            setMessage('Enter both a username and a display name.');
            return;
        }
        const optionalPassword = input.password.trim();
        try {
            const passwordHash = optionalPassword
                ? await hashPassword(optionalPassword)
                : undefined;
            await saveAccount({
                userId: crypto.randomUUID(),
                username,
                displayName,
                role: input.role,
                isActive: true,
                passwordConfigured: optionalPassword.length > 0,
                usesDefaultPassword: passwordHash === defaultPasswordHash,
                ...(passwordHash ? { passwordHash } : {}),
            });
            setMessage(getOperatorCreationMessage(input.role));
        } catch (reason) {
            setMessage(reason instanceof Error ? reason.message : 'Operator could not be created.');
        }
    };

    const changePassword = async (input: {
        readonly password: string;
        readonly userId: string;
    }) => {
        if (!input.userId || !input.password.trim()) {
            setMessage('Choose an account and enter a password.');
            return;
        }
        await resetPassword(input.userId, input.password);
        setMessage('Password saved.');
    };

    const activateLicense = () => {
        const licenseKey = activationForm.state.values.licenseKey.trim();
        if (!licenseKey) return;
        const activation = window.vaultBillDesktop
            ? window.vaultBillDesktop.activateLicense(licenseKey)
            : capabilities.isHostedWeb
              ? requestHostedApi('/trial/activate', 'POST', { licenseKey })
              : Promise.resolve();
        void activation
            .then(() => {
                setMessage('License accepted. Full access is now enabled.');
                activationForm.reset();
            })
            .catch((reason: unknown) => {
                setMessage(
                    reason instanceof Error
                        ? reason.message
                        : 'That license key could not be used.',
                );
            });
    };

    return {
        activeUserCount: accounts.filter((account) => account.role === 'User' && account.isActive)
            .length,
        archiveAccount,
        canLanServer: capabilities.canLanServer,
        createOperator,
        defaultCredentialsActive: isDefaultCredentialsActive(
            credentialStatus?.sysAdminUsesDefaultPassword,
            credentialStatus?.backupUsesDefaultPassword,
        ),
        activationForm,
        isDemoMode: capabilities.isDemoMode,
        includeDraftsInReports,
        lanEnabled,
        manageableAccounts: getManageableSecurityAccounts(
            accounts,
            operatorContext?.role ?? 'User',
        ),
        message,
        onChangePassword: changePassword,
        onLanEnabledChange: (value: boolean) => {
            setLanEnabled(value);
            void window.vaultBillDesktop?.configureLocalApi({
                lanEnabled: value,
                passwordRequired: true,
                port: defaultHostedWebPort,
            });
        },
        onIncludeDraftsInReportsChange: (value: boolean) => {
            const previousValue = includeDraftsInReports;
            setIncludeDraftsInReports(value);
            const save = async () => {
                const current = await loadWorkspaceSettings(capabilities.isHostedWeb);
                const nextSettings = { ...current, includeDraftsInReports: value };
                if (window.vaultBillDesktop) {
                    await window.vaultBillDesktop.saveBusinessSettings(nextSettings);
                    return;
                }
                if (capabilities.isHostedWeb) {
                    await requestHostedApi('/settings/business', 'POST', nextSettings);
                }
            };
            void save().catch((reason: unknown) => {
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
        onActivateLicense: activateLicense,
        trialStatus,
    };
};
