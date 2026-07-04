/** @format */

import type { FC } from 'react';
import { useState } from 'react';

import { KeyRound, ShieldCheck } from 'lucide-react';

import type { RuntimePlatform } from '../../capability/Capability.types';
import { ActionButton } from '../../components/ActionButton';
import { AppConfirmDialog } from '../../components/AppConfirmDialog/AppConfirmDialog';
import { FormField } from '../../components/FormFields';
import {
    readAndroidPairingSettings,
    saveAndroidPairingSettings,
    scanAndroidPairingHosts,
} from '../../runtime/AndroidPairing';
import { formatTrialCountdown } from '../dashboard/SysAdminDashboardTrialSupport';
import type { SettingsActivationFormApi } from './SettingsSecuritySectionSupport';

type SettingsSecurityAccessProps = {
    readonly isSysAdmin: boolean;
    readonly isDemoMode: boolean;
    readonly canLanServer: boolean;
    readonly lanEnabled: boolean;
    readonly hostedWebAutoStart: boolean;
    readonly hostedWebServerRunning: boolean;
    readonly runtimePlatform: RuntimePlatform;
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
    readonly onResetTrial: () => void;
};

/** Renders the trial, activation, and hosted-web controls. */
export const SettingsSecurityAccess: FC<SettingsSecurityAccessProps> = ({
    isSysAdmin,
    isDemoMode,
    canLanServer,
    lanEnabled,
    hostedWebAutoStart,
    hostedWebServerRunning,
    runtimePlatform,
    activationForm,
    trialStatus,
    onLanEnabledChange,
    onHostedWebAutoStartChange,
    onStartHostedWebServer,
    onStopHostedWebServer,
    onRestartHostedWebServer,
    onActivateLicense,
    onResetTrial,
}) => {
    const [isResetTrialConfirmOpen, setIsResetTrialConfirmOpen] = useState(false);
    const [androidPairing, setAndroidPairing] = useState(() => readAndroidPairingSettings());
    const [isPairingScanRunning, setIsPairingScanRunning] = useState(false);
    const isAndroidRuntime =
        runtimePlatform === 'android-local' || runtimePlatform === 'android-paired';
    const saveAndroidPairing = (enabled: boolean) => {
        const nextSettings = {
            enabled,
            hostTarget: enabled ? androidPairing.hostTarget.trim() : '',
            connectionStatus: enabled ? 'unknown' : 'disconnected',
            discoveredHosts: androidPairing.discoveredHosts,
        } as const;
        saveAndroidPairingSettings(nextSettings);
        setAndroidPairing(nextSettings);
    };
    const scanAndroidHosts = () => {
        setIsPairingScanRunning(true);
        void scanAndroidPairingHosts(androidPairing.hostTarget)
            .then((discoveredHosts) => {
                const nextSettings = {
                    ...androidPairing,
                    discoveredHosts,
                    connectionStatus: discoveredHosts.length ? 'connected' : 'unknown',
                } as const;
                saveAndroidPairingSettings(nextSettings);
                setAndroidPairing(nextSettings);
            })
            .finally(() => {
                setIsPairingScanRunning(false);
            });
    };

    return (
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
                    <ActionButton
                        onClick={() => {
                            setIsResetTrialConfirmOpen(true);
                        }}
                        variant="secondary"
                    >
                        Reset trial
                    </ActionButton>
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
                                Hosted web is currently{' '}
                                {hostedWebServerRunning ? 'running' : 'stopped'}.
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
            {isSysAdmin && isAndroidRuntime ? (
                <div className="settings-subsection">
                    <div className="section-heading">
                        <div>
                            <h3>Mobile desktop pairing</h3>
                            <p>
                                Pair this Android workspace to a live desktop host, or keep it using
                                local mobile data.
                            </p>
                        </div>
                        <ShieldCheck aria-hidden="true" />
                    </div>
                    <FormField.TextField
                        label="Desktop host"
                        onChange={(event) => {
                            setAndroidPairing({
                                ...androidPairing,
                                hostTarget: event.currentTarget.value,
                            });
                        }}
                        placeholder="http://192.168.1.10:80/VaultBill/"
                        value={androidPairing.hostTarget}
                    />
                    <p className="field-note" role="status">
                        {androidPairing.enabled
                            ? 'Android is paired to a desktop host for this session.'
                            : 'Android is using its local mobile workspace.'}
                    </p>
                    {androidPairing.discoveredHosts.length ? (
                        <div className="operator-create">
                            {androidPairing.discoveredHosts.map((host) => (
                                <ActionButton
                                    key={host}
                                    onClick={() => {
                                        setAndroidPairing({
                                            ...androidPairing,
                                            hostTarget: host,
                                        });
                                    }}
                                >
                                    {host}
                                </ActionButton>
                            ))}
                        </div>
                    ) : null}
                    <div className="operator-create">
                        <ActionButton
                            disabled={isPairingScanRunning}
                            onClick={scanAndroidHosts}
                            variant="secondary"
                        >
                            {isPairingScanRunning ? 'Scanning...' : 'Scan LAN'}
                        </ActionButton>
                        <ActionButton
                            disabled={!androidPairing.hostTarget.trim()}
                            onClick={() => {
                                saveAndroidPairing(true);
                            }}
                            variant="primary"
                        >
                            Save pairing
                        </ActionButton>
                        <ActionButton
                            disabled={!androidPairing.enabled && !androidPairing.hostTarget}
                            onClick={() => {
                                saveAndroidPairing(false);
                            }}
                            variant="secondary"
                        >
                            Use local mobile
                        </ActionButton>
                    </div>
                </div>
            ) : null}
            <AppConfirmDialog
                confirmLabel="Reset trial"
                description="This clears activation and accumulated trial time, then starts a fresh unactivated 24-hour trial."
                isOpen={isResetTrialConfirmOpen}
                onCancel={() => {
                    setIsResetTrialConfirmOpen(false);
                }}
                onConfirm={() => {
                    setIsResetTrialConfirmOpen(false);
                    onResetTrial();
                }}
                title="Reset trial?"
            />
        </>
    );
};
