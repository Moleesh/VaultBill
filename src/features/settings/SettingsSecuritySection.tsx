/** @format */

import type { FC } from 'react';

import { SettingsSecurityAccess } from './SettingsSecurityAccess';
import { SettingsSecurityAccounts } from './SettingsSecurityAccounts';
import { SettingsSecurityReportsSection } from './SettingsSecurityReportsSection';
import { useSettingsSecuritySectionState } from './SettingsSecuritySectionSupport';

/** Renders the security area with account, access, and reports controls. */
export const SettingsSecuritySection: FC = () => {
    const state = useSettingsSecuritySectionState();

    if (!state.operatorContext) return null;

    return (
        <section className="settings-section" id="security">
            <header>
                <p className="eyebrow">Security</p>
                <h2>Accounts and access</h2>
            </header>
            {state.defaultCredentialsActive ? (
                <p className="field-note">
                    Default credentials are still active. Replace the System Administrator and
                    backup passwords when you are ready.
                </p>
            ) : null}
            <SettingsSecurityAccounts
                canCreateOperator={
                    state.newUsername.trim().length > 0 &&
                    state.newDisplayName.trim().length > 0 &&
                    !(state.newRole === 'User' && state.activeUserCount >= 5)
                }
                manageableAccounts={state.manageableAccounts}
                newDisplayName={state.newDisplayName}
                newOperatorPassword={state.newOperatorPassword}
                newPassword={state.newPassword}
                newRole={state.newRole}
                newUsername={state.newUsername}
                operatorRole={state.operatorRole}
                onArchiveAccount={(userId) => {
                    void state.archiveAccount(userId);
                }}
                onChangePassword={state.onChangePassword}
                onCreateOperator={state.createOperator}
                onNewDisplayNameChange={state.onNewDisplayNameChange}
                onNewOperatorPasswordChange={state.onNewOperatorPasswordChange}
                onNewPasswordChange={state.onNewPasswordChange}
                onNewRoleChange={state.onNewRoleChange}
                onNewUsernameChange={state.onNewUsernameChange}
                onPasswordUserIdChange={state.onPasswordUserIdChange}
                onSetAccountActive={state.onSetAccountActive}
                passwordUserId={state.passwordUserId}
            />
            {state.operatorRole === 'SysAdmin' && state.activeUserCount >= 5 ? (
                <p className="field-note" role="status">
                    VaultBill allows up to five active Users. Deactivate one before adding another.
                </p>
            ) : null}
            <SettingsSecurityAccess
                canLanServer={state.canLanServer}
                isDemoMode={state.isDemoMode}
                isSysAdmin={state.operatorRole === 'SysAdmin'}
                lanEnabled={state.lanEnabled}
                licenseKey={state.licenseKey}
                onActivateLicense={state.onActivateLicense}
                onLanEnabledChange={state.onLanEnabledChange}
                onLicenseKeyChange={state.onLicenseKeyChange}
                trialStatus={state.trialStatus}
            />
            {state.operatorRole === 'SysAdmin' ? (
                <SettingsSecurityReportsSection
                    includeDraftsInReports={state.includeDraftsInReports}
                    onIncludeDraftsInReportsChange={state.setIncludeDraftsInReports}
                />
            ) : null}
            {state.message ? (
                <p className="feedback-info" role="status">
                    {state.message}
                </p>
            ) : null}
        </section>
    );
};
