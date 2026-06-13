/** @format */

import { useEffect, useState } from 'react';
import type { FC } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import { requestHostedApi } from '../../runtime/HostedApi';
import {
    defaultSecretsSettings,
    normalizeSecretsSettings,
    SecretsSectionCard,
    SecretsTable,
    type SecretsSettings,
} from './SettingsIntegrationsSectionSupport';

/** Owns the shared Secrets table for GST, SMS, and formula references. */
export const SettingsIntegrationsSection: FC = () => {
    const capabilities = useCapabilities();
    const [settings, setSettings] = useState<SecretsSettings>(defaultSecretsSettings);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const secretRequest = window.vaultBillDesktop
            ? window.vaultBillDesktop.getIntegrationSettings()
            : capabilities.isLanBrowser
              ? requestHostedApi('/settings/integrations')
              : undefined;
        void secretRequest?.then((rawSettings) => {
            setSettings(normalizeSecretsSettings(rawSettings));
        });
    }, [capabilities.isLanBrowser]);

    const saveSecrets = () => {
        const persistence = window.vaultBillDesktop
            ? window.vaultBillDesktop.saveIntegrationSettings(settings)
            : capabilities.isLanBrowser
              ? requestHostedApi('/settings/integrations', 'POST', settings)
              : Promise.resolve(settings);
        void persistence
            .then(() => {
                setMessage('Secrets saved.');
            })
            .catch((reason: unknown) => {
                setMessage(
                    reason instanceof Error ? reason.message : 'Secrets could not be saved.',
                );
            });
    };

    return (
        <section className="settings-section" id="secrets">
            <header>
                <p className="eyebrow">Secrets</p>
                <h2>Secrets</h2>
                <p>
                    Store shared keys and values here. Use them in formulas as{' '}
                    <code>Secrets.Key</code>.
                </p>
            </header>
            <SecretsSectionCard
                description="Keep shared values for GST, SMS, and formula references in a single table."
                title="Secrets"
            >
                <SecretsTable
                    onChange={(secrets) => {
                        setSettings({ secrets });
                    }}
                    secrets={settings.secrets}
                />
            </SecretsSectionCard>
            <button className="button-primary" onClick={saveSecrets} type="button">
                Save secrets
            </button>
            {message ? (
                <p className="feedback-info" role="status">
                    {message}
                </p>
            ) : null}
        </section>
    );
};
