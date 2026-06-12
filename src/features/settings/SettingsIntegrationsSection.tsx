/** @format */

import { ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FC } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import { requestHostedApi } from '../../runtime/HostedApi';

const gstProviderOptions = [
    { value: 'local-gsp', label: 'Local GSP helper', description: 'Good for desktop testing' },
    { value: 'sandbox-gsp', label: 'Sandbox GSP', description: 'Use provider sandbox details' },
    { value: 'custom-gsp', label: 'Custom API', description: 'Enter your own endpoint' },
] as const;

const smsProviderOptions = [
    { value: 'local-relay', label: 'Local relay', description: 'Simple desktop gateway' },
    { value: 'trial-provider', label: 'Trial SMS provider', description: 'Starter integration' },
    { value: 'custom-sms', label: 'Custom API', description: 'Use your own endpoint' },
] as const;

/** Owns GST/GSP, SMS, and signature integration settings. */
export const SettingsIntegrationsSection: FC = () => {
    const capabilities = useCapabilities();
    const [gstEnabled, setGstEnabled] = useState(false);
    const [gspProvider, setGspProvider] = useState('');
    const [smsEnabled, setSmsEnabled] = useState(false);
    const [smsProvider, setSmsProvider] = useState('');
    const [signatureEnabled, setSignatureEnabled] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const integrationRequest = window.vaultBillDesktop
            ? window.vaultBillDesktop.getIntegrationSettings()
            : capabilities.isLanBrowser
              ? requestHostedApi('/settings/integrations')
              : undefined;
        void integrationRequest?.then((rawSettings) => {
            const settings = rawSettings as {
                gstEnabled?: unknown;
                gspProvider?: unknown;
                smsEnabled?: unknown;
                smsProvider?: unknown;
                signatureEnabled?: unknown;
            };
            if (typeof settings.gstEnabled === 'boolean') setGstEnabled(settings.gstEnabled);
            if (typeof settings.gspProvider === 'string') setGspProvider(settings.gspProvider);
            if (typeof settings.smsEnabled === 'boolean') setSmsEnabled(settings.smsEnabled);
            if (typeof settings.smsProvider === 'string') setSmsProvider(settings.smsProvider);
            if (typeof settings.signatureEnabled === 'boolean')
                setSignatureEnabled(settings.signatureEnabled);
        });
    }, [capabilities.isLanBrowser]);

    const saveIntegrations = () => {
        const settings = {
            gstEnabled,
            gspProvider,
            smsEnabled,
            smsProvider,
            signatureEnabled,
        };
        const persistence = window.vaultBillDesktop
            ? window.vaultBillDesktop.saveIntegrationSettings(settings)
            : capabilities.isLanBrowser
              ? requestHostedApi('/settings/integrations', 'POST', settings)
              : Promise.resolve(settings);
        void persistence
            .then(() => {
                setMessage('Integration settings saved.');
            })
            .catch((reason: unknown) => {
                setMessage(
                    reason instanceof Error
                        ? reason.message
                        : 'Integration settings could not be saved.',
                );
            });
    };

    return (
        <section className="settings-section" id="integrations">
            <header>
                <p className="eyebrow">Integrations</p>
                <h2>Connected services</h2>
            </header>
            <div className="settings-subsection">
                <div className="section-heading">
                    <div>
                        <h3>GST and GSP</h3>
                        <p>
                            Keep tax helpers close to the invoice and builder settings they affect.
                        </p>
                    </div>
                    <ShieldCheck aria-hidden="true" />
                </div>
                <div className="operator-create">
                    <label className="checkbox-field">
                        <input
                            checked={gstEnabled}
                            onChange={(event) => {
                                setGstEnabled(event.currentTarget.checked);
                            }}
                            type="checkbox"
                        />
                        <span>Enable GST/GSP helpers</span>
                    </label>
                    <SearchableDropdown
                        label="Provider"
                        onChange={setGspProvider}
                        options={gstProviderOptions}
                        value={gspProvider}
                    />
                </div>
            </div>
            <div className="settings-subsection">
                <div className="section-heading">
                    <div>
                        <h3>SMS provider</h3>
                        <p>Pick a starter provider or point VaultBill to your own gateway.</p>
                    </div>
                    <ShieldCheck aria-hidden="true" />
                </div>
                <div className="operator-create">
                    <label className="checkbox-field">
                        <input
                            checked={smsEnabled}
                            onChange={(event) => {
                                setSmsEnabled(event.currentTarget.checked);
                            }}
                            type="checkbox"
                        />
                        <span>Enable SMS notifications</span>
                    </label>
                    <SearchableDropdown
                        label="Provider"
                        onChange={setSmsProvider}
                        options={smsProviderOptions}
                        value={smsProvider}
                    />
                </div>
            </div>
            <div className="settings-subsection">
                <div className="section-heading">
                    <div>
                        <h3>Signature capture</h3>
                        <p>Enable on-screen signing only when your workflow needs it.</p>
                    </div>
                    <ShieldCheck aria-hidden="true" />
                </div>
                <label className="checkbox-field">
                    <input
                        checked={signatureEnabled}
                        onChange={(event) => {
                            setSignatureEnabled(event.currentTarget.checked);
                        }}
                        type="checkbox"
                    />
                    <span>Allow on-screen signature capture</span>
                </label>
            </div>
            <button className="button-primary" onClick={saveIntegrations} type="button">
                Save integrations
            </button>
            {message ? (
                <p className="feedback-info" role="status">
                    {message}
                </p>
            ) : null}
        </section>
    );
};
