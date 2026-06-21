/** @format */

import { useForm } from '@tanstack/react-form';
import { useEffect, useState } from 'react';
import type { FC } from 'react';

import { ActionButton } from '../../components/ActionButton';
import { useCapabilities } from '../../capability/CapabilityContext';
import { requestHostedApi } from '../../runtime/HostedApi';
import {
    defaultSecretsSettings,
    normalizeSecretsSettings,
    SecretsSectionCard,
    SecretsTable,
    type SecretsSettings,
} from './SettingsSecretsSectionSupport';

/** Owns the shared Secrets table for formula and record references. */
export const SettingsSecretsSection: FC = () => {
    const capabilities = useCapabilities();
    const [settings, setSettings] = useState<SecretsSettings>(defaultSecretsSettings);
    const [message, setMessage] = useState('');
    const form = useForm({
        defaultValues: settings,
    });

    useEffect(() => {
        const secretRequest = window.vaultBillDesktop
            ? window.vaultBillDesktop.getSecretsSettings()
            : capabilities.isHostedWeb
              ? requestHostedApi('/settings/secrets')
              : undefined;
        void secretRequest?.then((rawSettings) => {
            setSettings(normalizeSecretsSettings(rawSettings));
        });
    }, [capabilities.isHostedWeb]);

    useEffect(() => {
        form.reset(settings);
    }, [form, settings]);

    const saveSecrets = () => {
        const currentSettings = form.state.values;
        const persistence = window.vaultBillDesktop
            ? window.vaultBillDesktop.saveSecretsSettings(currentSettings)
            : capabilities.isHostedWeb
              ? requestHostedApi('/settings/secrets', 'POST', currentSettings)
              : Promise.resolve(currentSettings);
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
                description="Keep shared values for formulas and builder references in a single table."
                title="Secrets"
            >
                <SecretsTable
                    onChange={(secrets) => {
                        form.setFieldValue('secrets', secrets);
                    }}
                    secrets={form.state.values.secrets}
                />
            </SecretsSectionCard>
            <ActionButton onClick={saveSecrets} variant="primary">
                Save secrets
            </ActionButton>
            {message ? (
                <p className="feedback-info" role="status">
                    {message}
                </p>
            ) : null}
        </section>
    );
};
