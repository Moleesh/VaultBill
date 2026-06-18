/** @format */
import { useEffect, useState } from 'react';
import type { Role } from '../../types/AppTypes';
import { useCapabilities } from '../../capability/CapabilityContext';
import { requestHostedApi } from '../../runtime/HostedApi';
import { hashPassword, defaultPasswordHash } from '../auth/SessionSupport';
import type { OperatorAccount } from '../auth/AccountTypes';
import { useSession } from '../auth/SessionContext';
import {
    getManageableSecurityAccounts,
    isDefaultCredentialsActive,
} from './SettingsSecuritySectionHelpers';

export const useSettingsSecuritySectionState = () => {
    const capabilities = useCapabilities();
    const { accounts, archiveAccount, operatorContext, resetPassword, saveAccount } = useSession();
    const [newUsername, setNewUsername] = useState('');
    const [newDisplayName, setNewDisplayName] = useState('');
    const [newOperatorPassword, setNewOperatorPassword] = useState('');
    const [newRole, setNewRole] = useState<Role>('User');
    const [passwordUserId, setPasswordUserId] = useState(operatorContext?.account.userId ?? '');
    const [newPassword, setNewPassword] = useState('');
    const [licenseKey, setLicenseKey] = useState('');
    const [lanEnabled, setLanEnabled] = useState(
        () => window.localStorage.getItem('vaultbill.lan.enabled') === 'true',
    );
    const [trialStatus, setTrialStatus] = useState<
        | {
              readonly isFullVersion: boolean;
              readonly isExpired: boolean;
              readonly remainingSeconds: number;
          }
        | undefined
    >();
    const [credentialStatus, setCredentialStatus] = useState<{
        readonly sysAdminUsesDefaultPassword: boolean;
        readonly backupUsesDefaultPassword: boolean;
    }>();
    const [message, setMessage] = useState('');
    const [includeDraftsInReports, setIncludeDraftsInReports] = useState(
        () => window.localStorage.getItem('vaultbill.reports.include-drafts') === 'true',
    );

    useEffect(() => {
        if (window.vaultBillDesktop) {
            void window.vaultBillDesktop.getCredentialStatus().then((status) => {
                setCredentialStatus(status);
            });
            void window.vaultBillDesktop.getTrialStatus().then((status) => {
                setTrialStatus(status);
            });
            void window.vaultBillDesktop.getHostedWebSettings().then((settings) => {
                setLanEnabled(settings.lanEnabled);
                window.localStorage.setItem('vaultbill.lan.enabled', String(settings.lanEnabled));
            });
        } else if (capabilities.isLanBrowser) {
            void requestHostedApi<{
                readonly sysAdminUsesDefaultPassword: boolean;
                readonly backupUsesDefaultPassword: boolean;
            }>('/credentials/status').then((status) => {
                setCredentialStatus(status);
            });
            void requestHostedApi<{
                readonly isFullVersion: boolean;
                readonly isExpired: boolean;
                readonly remainingSeconds: number;
            }>('/trial/status').then((status) => {
                setTrialStatus(status);
            });
        }
    }, [capabilities.isLanBrowser]);

    useEffect(() => {
        window.localStorage.setItem(
            'vaultbill.reports.include-drafts',
            String(includeDraftsInReports),
        );
    }, [includeDraftsInReports]);

    const createOperator = async () => {
        const username = newUsername.trim();
        const displayName = newDisplayName.trim();
        if (!username || !displayName) {
            setMessage('Username and display name are required.');
            return;
        }
        const optionalPassword = newOperatorPassword.trim();
        try {
            const passwordHash = optionalPassword
                ? await hashPassword(optionalPassword)
                : undefined;
            await saveAccount({
                userId: crypto.randomUUID(),
                username,
                displayName,
                role: newRole,
                isActive: true,
                passwordConfigured: optionalPassword.length > 0,
                usesDefaultPassword: passwordHash === defaultPasswordHash,
                ...(passwordHash ? { passwordHash } : {}),
            });
            setNewUsername('');
            setNewDisplayName('');
            setNewOperatorPassword('');
            setMessage(
                newRole === 'Admin'
                    ? 'Operator created. The admin can manage users after a password is set.'
                    : 'Operator created. Set a password before enabling LAN login.',
            );
        } catch (reason) {
            setMessage(reason instanceof Error ? reason.message : 'Operator could not be created.');
        }
    };

    const changePassword = () => {
        if (!passwordUserId || !newPassword.trim()) {
            setMessage('Choose an account and enter a new password.');
            return;
        }
        void resetPassword(passwordUserId, newPassword).then(() => {
            setNewPassword('');
            setMessage('Password updated.');
        });
    };

    const activateLicense = () => {
        if (!licenseKey.trim()) return;
        const activation = window.vaultBillDesktop
            ? window.vaultBillDesktop.activateLicense(licenseKey.trim())
            : capabilities.isLanBrowser
              ? requestHostedApi('/trial/activate', 'POST', { licenseKey: licenseKey.trim() })
              : Promise.resolve();
        void activation
            .then(() => {
                setMessage('License key accepted. Full version activated.');
                setLicenseKey('');
            })
            .catch((reason: unknown) => {
                setMessage(
                    reason instanceof Error ? reason.message : 'License key could not be used.',
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
        isDemoMode: capabilities.isDemoMode,
        includeDraftsInReports,
        lanEnabled,
        licenseKey,
        manageableAccounts: getManageableSecurityAccounts(
            accounts,
            operatorContext?.role ?? 'User',
        ),
        message,
        newDisplayName,
        newOperatorPassword,
        newPassword,
        newRole,
        newUsername,
        onChangePassword: changePassword,
        onLanEnabledChange: (value: boolean) => {
            setLanEnabled(value);
            window.localStorage.setItem('vaultbill.lan.enabled', String(value));
            void window.vaultBillDesktop?.configureLocalApi({
                lanEnabled: value,
                passwordRequired: true,
                port: 4317,
            });
        },
        onLicenseKeyChange: setLicenseKey,
        onNewDisplayNameChange: setNewDisplayName,
        onNewOperatorPasswordChange: setNewOperatorPassword,
        onNewPasswordChange: setNewPassword,
        onNewRoleChange: setNewRole,
        onNewUsernameChange: setNewUsername,
        onPasswordUserIdChange: setPasswordUserId,
        onSetAccountActive: (account: OperatorAccount, isActive: boolean) => {
            void saveAccount({ ...account, isActive });
        },
        operatorContext,
        operatorRole: operatorContext?.role ?? 'User',
        passwordUserId,
        setIncludeDraftsInReports,
        onActivateLicense: activateLicense,
        trialStatus,
    };
};
