/** @format */

import { KeyRound, ShieldCheck } from 'lucide-react';
import type { FC } from 'react';

import { formatTrialCountdown } from '../dashboard/SysAdminDashboardSupport';

type SettingsSecurityAccessProps = {
    readonly isSysAdmin: boolean;
    readonly isDemoMode: boolean;
    readonly canLanServer: boolean;
    readonly lanEnabled: boolean;
    readonly licenseKey: string;
    readonly trialStatus:
        | {
              readonly isFullVersion: boolean;
              readonly isExpired: boolean;
              readonly remainingSeconds: number;
          }
        | undefined;
    readonly onLanEnabledChange: (value: boolean) => void;
    readonly onLicenseKeyChange: (value: string) => void;
    readonly onActivateLicense: () => void;
};

/** Renders the trial, activation, and hosted-web controls. */
export const SettingsSecurityAccess: FC<SettingsSecurityAccessProps> = ({
    isSysAdmin,
    isDemoMode,
    canLanServer,
    lanEnabled,
    licenseKey,
    trialStatus,
    onLanEnabledChange,
    onLicenseKeyChange,
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
                        <label>
                            <span>License key</span>
                            <input
                                value={licenseKey}
                                onChange={(event) => {
                                    onLicenseKeyChange(event.currentTarget.value);
                                }}
                            />
                        </label>
                        <button
                            disabled={!licenseKey.trim()}
                            onClick={onActivateLicense}
                            type="button"
                        >
                            Activate full version
                        </button>
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
                <label className="checkbox-field">
                    <input
                        checked={lanEnabled}
                        disabled={!canLanServer}
                        onChange={(event) => {
                            onLanEnabledChange(event.currentTarget.checked);
                        }}
                        type="checkbox"
                    />
                    <span>Hosted web access enabled</span>
                </label>
            </div>
        ) : null}
    </>
);
