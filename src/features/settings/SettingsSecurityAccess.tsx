/** @format */

import type { FC } from 'react';

import { KeyRound, ShieldCheck } from 'lucide-react';

import { ActionButton } from '../../components/ActionButton';
import { FormField } from '../../components/FormFields';
import { formatTrialCountdown } from '../dashboard/SysAdminDashboardTrialSupport';
import type { SettingsActivationFormApi } from './SettingsSecuritySectionSupport';

type SettingsSecurityAccessProps = {
    readonly isSysAdmin: boolean;
    readonly isDemoMode: boolean;
    readonly canLanServer: boolean;
    readonly lanEnabled: boolean;
    readonly hostedWebAutoStart: boolean;
    readonly hostedWebServerRunning: boolean;
    readonly activationForm: SettingsActivationFormApi;
    readonly trialStatus:
        | {
              readonly isFullVersion: boolean;
              readonly isExpired: boolean;
              readonly remainingSeconds: number;
          }
        | undefined;
    readonly onLanEnabledChange: (value: boolean) => void;
    readonly onHostedWebAutoStartChange: (value: boolean) => void;
    readonly onStartHostedWebServer: () => void;
    readonly onStopHostedWebServer: () => void;
    readonly onRestartHostedWebServer: () => void;
    readonly onActivateLicense: () => void;
};

/** Renders the trial, activation, and hosted-web controls. */
export const SettingsSecurityAccess: FC<SettingsSecurityAccessProps> = ({
    isSysAdmin,
    isDemoMode,
    canLanServer,
    lanEnabled,
    hostedWebAutoStart,
    hostedWebServerRunning,
    activationForm,
    trialStatus,
    onLanEnabledChange,
    onHostedWebAutoStartChange,
    onStartHostedWebServer,
    onStopHostedWebServer,
    onRestartHostedWebServer,
    onActivateLicense,
}) => (
    <>
        {isSysAdmin && !isDemoMode ? (
            <div className="settings-subsection">
                <div className="section-heading">
                    <div>
                        <h3>Activation and trial</h3>
                        <p>
                            {trialStatus?.isFullVersion
                                ? 'Full version activated.'
                                : trialStatus?.isExpired
                                  ? 'The accumulated-use trial has expired. Read-only access remains available.'
                                  : `${formatTrialCountdown(trialStatus?.remainingSeconds ?? 0)} left.`}
                        </p>
                    </div>
                    <KeyRound aria-hidden="true" />
                </div>
                {!trialStatus?.isFullVersion ? (
                    <div className="operator-create">
                        <activationForm.Field name="licenseKey">
                            {(field) => (
                                <FormField.TextField
                                    label="License key"
                                    onChange={(event) => {
                                        field.handleChange(event.currentTarget.value);
                                    }}
                                    value={field.state.value}
                                />
                            )}
                        </activationForm.Field>
                        <ActionButton
                            disabled={!activationForm.state.values.licenseKey.trim()}
                            onClick={onActivateLicense}
                            variant="primary"
                        >
                            Activate full version
                        </ActionButton>
                    </div>
                ) : null}
            </div>
        ) : null}
        {isSysAdmin ? (
            <div className="settings-subsection">
                <div className="section-heading">
                    <div>
                        <h3>Hosted web access</h3>
                        <p>Enable or disable hosted web access for this desktop session.</p>
                    </div>
                    <ShieldCheck aria-hidden="true" />
                </div>
                {canLanServer ? (
                    <>
                        <FormField.CheckboxField
                            checked={lanEnabled}
                            label={
                                lanEnabled
                                    ? 'Allow hosted web access from the network'
                                    : 'Keep hosted web access on this computer only'
                            }
                            onChange={(event) => {
                                onLanEnabledChange(event.currentTarget.checked);
                            }}
                        />
                        <FormField.CheckboxField
                            checked={hostedWebAutoStart}
                            label="Start hosted web automatically when VaultBill opens"
                            onChange={(event) => {
                                onHostedWebAutoStartChange(event.currentTarget.checked);
                            }}
                        />
                        <p className="field-note" role="status">
                            Hosted web is currently {hostedWebServerRunning ? 'running' : 'stopped'}
                            .
                        </p>
                        <div className="operator-create">
                            <ActionButton
                                disabled={hostedWebServerRunning}
                                onClick={onStartHostedWebServer}
                                variant="secondary"
                            >
                                Start hosted web
                            </ActionButton>
                            <ActionButton
                                disabled={!hostedWebServerRunning}
                                onClick={onStopHostedWebServer}
                                variant="secondary"
                            >
                                Stop hosted web
                            </ActionButton>
                            <ActionButton
                                disabled={!hostedWebServerRunning}
                                onClick={onRestartHostedWebServer}
                                variant="primary"
                            >
                                Restart hosted web
                            </ActionButton>
                        </div>
                    </>
                ) : (
                    <p className="field-note">
                        Hosted web access is managed from VaultBill Desktop when the local host
                        service is available.
                    </p>
                )}
            </div>
        ) : null}
    </>
);
