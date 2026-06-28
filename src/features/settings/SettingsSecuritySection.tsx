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
                manageableAccounts={state.manageableAccounts}
                operatorRole={state.operatorRole}
                onArchiveAccount={(userId) => {
                    void state.archiveAccount(userId);
                }}
                onChangePassword={state.onChangePassword}
                onCreateOperator={state.createOperator}
                onSetAccountActive={state.onSetAccountActive}
            />
            {state.operatorRole === 'SysAdmin' && state.activeUserCount >= 5 ? (
                <p className="field-note" role="status">
                    VaultBill allows up to five active Users. Deactivate one before adding another.
                </p>
            ) : null}
            <SettingsSecurityAccess
                activationForm={state.activationForm}
                canLanServer={state.canLanServer}
                hostedWebAutoStart={state.hostedWebAutoStart}
                hostedWebServerRunning={state.hostedWebServerRunning}
                isDemoMode={state.isDemoMode}
                isSysAdmin={state.operatorRole === 'SysAdmin'}
                lanEnabled={state.lanEnabled}
                onActivateLicense={state.onActivateLicense}
                onHostedWebAutoStartChange={state.onHostedWebAutoStartChange}
                onLanEnabledChange={state.onLanEnabledChange}
                onRestartHostedWebServer={state.onRestartHostedWebServer}
                onStartHostedWebServer={state.onStartHostedWebServer}
                onStopHostedWebServer={state.onStopHostedWebServer}
                trialStatus={state.trialStatus}
            />
            {state.operatorRole === 'SysAdmin' ? (
                <SettingsSecurityReportsSection
                    includeDraftsInReports={state.includeDraftsInReports}
                    onIncludeDraftsInReportsChange={state.onIncludeDraftsInReportsChange}
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
