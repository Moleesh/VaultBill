/** @format */

import { KeyRound, ShieldCheck } from 'lucide-react';
import type { FC } from 'react';

import { ActionButton } from '../../components/ActionButton';
import { FormField } from '../../components/FormFields';
import { formatTrialCountdown } from '../dashboard/SysAdminDashboardTrialSupport';
import type { SettingsActivationFormApi } from './SettingsSecuritySectionSupport';

type SettingsSecurityAccessProps = {
    readonly isSysAdmin: boolean;
    readonly isDemoMode: boolean;
    readonly canLanServer: boolean;
    readonly lanEnabled: boolean;
    readonly activationForm: SettingsActivationFormApi;
    readonly trialStatus:
        | {
              readonly isFullVersion: boolean;
              readonly isExpired: boolean;
              readonly remainingSeconds: number;
          }
        | undefined;
    readonly onLanEnabledChange: (value: boolean) => void;
    readonly onActivateLicense: () => void;
};

/** Renders the trial, activation, and hosted-web controls. */
export const SettingsSecurityAccess: FC<SettingsSecurityAccessProps> = ({
    isSysAdmin,
    isDemoMode,
    canLanServer,
    lanEnabled,
    activationForm,
    trialStatus,
    onLanEnabledChange,
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
                    <FormField.CheckboxField
                        checked={lanEnabled}
                        label={
                            lanEnabled ? 'Hosted web access enabled' : 'Hosted web access disabled'
                        }
                        onChange={(event) => {
                            onLanEnabledChange(event.currentTarget.checked);
                        }}
                    />
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
