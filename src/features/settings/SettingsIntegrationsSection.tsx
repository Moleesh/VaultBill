/** @format */

import { useEffect, useState } from 'react';
import type { FC } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import { requestHostedApi } from '../../runtime/HostedApi';
import {
    defaultIntegrationSettings,
    IntegrationServiceCard,
    normalizeIntegrationSettings,
    providerOptions,
    type IntegrationSettings,
} from './SettingsIntegrationsSectionSupport';

/** Owns shared key/value integration settings for GST, SMS, and future services. */
export const SettingsIntegrationsSection: FC = () => {
    const capabilities = useCapabilities();
    const [settings, setSettings] = useState<IntegrationSettings>(defaultIntegrationSettings);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const integrationRequest = window.vaultBillDesktop
            ? window.vaultBillDesktop.getIntegrationSettings()
            : capabilities.isLanBrowser
              ? requestHostedApi('/settings/integrations')
              : undefined;
        void integrationRequest?.then((rawSettings) => {
            setSettings(normalizeIntegrationSettings(rawSettings));
        });
    }, [capabilities.isLanBrowser]);

    const saveIntegrations = () => {
        const persistence = window.vaultBillDesktop
            ? window.vaultBillDesktop.saveIntegrationSettings(settings)
            : capabilities.isLanBrowser
              ? requestHostedApi('/settings/integrations', 'POST', settings)
              : Promise.resolve(settings);
        void persistence
            .then(() => {
                setMessage('Connected services saved.');
            })
            .catch((reason: unknown) => {
                setMessage(
                    reason instanceof Error
                        ? reason.message
                        : 'Connected services could not be saved.',
                );
            });
    };

    return (
        <section className="settings-section" id="integrations">
            <header>
                <p className="eyebrow">Integrations</p>
                <h2>Connected services</h2>
                <p>Store provider keys and related values as JSON-backed key/value pairs.</p>
            </header>
            <IntegrationServiceCard
                description="Store GST provider details in a shared JSON-style key/value table."
                onServiceChange={(service) => {
                    setSettings((current) => ({ ...current, gst: service }));
                }}
                providerChoices={providerOptions.gst}
                providerValue={settings.gst.provider}
                service={settings.gst}
                title="GST service"
            />
            <IntegrationServiceCard
                description="Store SMS provider routing and keys in the same flexible JSON-style model."
                onServiceChange={(service) => {
                    setSettings((current) => ({ ...current, sms: service }));
                }}
                providerChoices={providerOptions.sms}
                providerValue={settings.sms.provider}
                service={settings.sms}
                title="SMS provider"
            />
            <button className="button-primary" onClick={saveIntegrations} type="button">
                Save connected services
            </button>
            {message ? (
                <p className="feedback-info" role="status">
                    {message}
                </p>
            ) : null}
        </section>
    );
};
