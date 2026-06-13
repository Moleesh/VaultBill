/** @format */

import { useEffect, useState } from 'react';
import type { FC } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import { requestHostedApi } from '../../runtime/HostedApi';
import type { Role } from '../../types/AppTypes';
import { useSession } from '../auth/SessionContext';
import { SettingsSecurityAccess } from './SettingsSecurityAccess';
import { SettingsSecurityAccounts } from './SettingsSecurityAccounts';

type OperatorAccount = {
    readonly userId: string;
    readonly username: string;
    readonly displayName: string;
    readonly role: Role;
    readonly isActive: boolean;
};

/** Owns the security area while delegating the visual blocks to small helpers. */
export const SettingsSecuritySection: FC = () => {
    const capabilities = useCapabilities();
    const { accounts, archiveAccount, operatorContext, resetPassword, saveAccount } = useSession();
    const [newUsername, setNewUsername] = useState('');
    const [newDisplayName, setNewDisplayName] = useState('');
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

    if (!operatorContext) return null;
    const manageableAccounts = accounts.filter((account) =>
        operatorContext.role === 'SysAdmin' ? account.role !== 'SysAdmin' : account.role === 'User',
    ) as readonly OperatorAccount[];
    const defaultCredentialsActive =
        credentialStatus?.sysAdminUsesDefaultPassword === true ||
        credentialStatus?.backupUsesDefaultPassword === true ||
        (!credentialStatus &&
            window.localStorage.getItem('vaultbill.default-credentials-active') !== 'false');

    const createOperator = async () => {
        const username = newUsername.trim();
        const displayName = newDisplayName.trim();
        if (!username || !displayName) {
            setMessage('Username and display name are required.');
            return;
        }
        try {
            await saveAccount({
                userId: crypto.randomUUID(),
                username,
                displayName,
                role: newRole,
                isActive: true,
            });
            setNewUsername('');
            setNewDisplayName('');
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

    return (
        <section className="settings-section" id="security">
            <header>
                <p className="eyebrow">Security</p>
                <h2>Accounts and access</h2>
            </header>
            {defaultCredentialsActive ? (
                <p className="field-note">
                    Default credentials are still active. Replace the System Administrator and
                    backup passwords when you are ready.
                </p>
            ) : null}
            <SettingsSecurityAccounts
                canCreateOperator={
                    newUsername.trim().length > 0 && newDisplayName.trim().length > 0
                }
                manageableAccounts={manageableAccounts}
                newDisplayName={newDisplayName}
                newPassword={newPassword}
                newRole={newRole}
                newUsername={newUsername}
                operatorRole={operatorContext.role}
                onArchiveAccount={(userId) => {
                    void archiveAccount(userId);
                }}
                onChangePassword={changePassword}
                onCreateOperator={createOperator}
                onNewDisplayNameChange={setNewDisplayName}
                onNewPasswordChange={setNewPassword}
                onNewRoleChange={setNewRole}
                onNewUsernameChange={setNewUsername}
                onPasswordUserIdChange={setPasswordUserId}
                onSetAccountActive={(account, isActive) => {
                    void saveAccount({ ...account, isActive });
                }}
                passwordUserId={passwordUserId}
            />
            <SettingsSecurityAccess
                canLanServer={capabilities.canLanServer}
                isDemoMode={capabilities.isDemoMode}
                isSysAdmin={operatorContext.role === 'SysAdmin'}
                lanEnabled={lanEnabled}
                licenseKey={licenseKey}
                onActivateLicense={activateLicense}
                onLanEnabledChange={(value) => {
                    setLanEnabled(value);
                    window.localStorage.setItem('vaultbill.lan.enabled', String(value));
                    void window.vaultBillDesktop?.configureLocalApi({
                        lanEnabled: value,
                        passwordRequired: true,
                        port: 4317,
                    });
                }}
                onLicenseKeyChange={setLicenseKey}
                trialStatus={trialStatus}
            />
            {message ? (
                <p className="feedback-info" role="status">
                    {message}
                </p>
            ) : null}
        </section>
    );
};
