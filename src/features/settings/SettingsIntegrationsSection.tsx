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

/** Owns GST/GSP and SMS integration settings. */
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
            </header>
            <IntegrationServiceCard
                description="Configure GST helpers and any API fields they need."
                onServiceChange={(service) => {
                    setSettings((current) => ({ ...current, gst: service }));
                }}
                providerChoices={providerOptions.gst}
                providerValue={settings.gst.provider}
                service={settings.gst}
                title="GST and GSP"
            />
            <IntegrationServiceCard
                description="Configure SMS routing, keys, and provider details."
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
