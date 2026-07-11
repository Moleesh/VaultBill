/** @format */

import type { FC } from 'react';
import { useEffect, useState } from 'react';

import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useCapabilities } from '../../capability/CapabilityContext';
import { ActionButton } from '../../components/ActionButton';
import { getRuntimeQueryScope, queryKeys } from '../../query/QueryKeys';
import { fetchSecretsSettings, saveSecretsSettings } from '../../query/RuntimeQueries';
import {
    defaultSecretsSettings,
    SecretsSectionCard,
    SecretsTable,
    type SecretsSettings,
} from './SettingsSecretsSectionSupport';

/** Owns the shared Secrets table for formula and record references. */
export const SettingsSecretsSection: FC = () => {
    const capabilities = useCapabilities();
    const queryClient = useQueryClient();
    const runtimeScope = getRuntimeQueryScope(capabilities);
    const [settings, setSettings] = useState<SecretsSettings>(defaultSecretsSettings);
    const [message, setMessage] = useState('');
    const secretsQuery = useQuery({
        queryKey: queryKeys.secretsSettings(runtimeScope),
        queryFn: () => fetchSecretsSettings({ capabilities }),
    });
    const saveSecretsMutation = useMutation({
        mutationFn: (currentSettings: SecretsSettings) =>
            saveSecretsSettings({
                capabilities,
                settings: currentSettings,
            }),
        onSuccess: async (_, currentSettings) => {
            setSettings(currentSettings);
            setMessage('Secrets saved.');
            await queryClient.invalidateQueries({
                queryKey: queryKeys.secretsSettings(runtimeScope),
            });
        },
        onError: (reason: unknown) => {
            setMessage(reason instanceof Error ? reason.message : 'Secrets could not be saved.');
        },
    });
    const form = useForm({
        defaultValues: settings,
    });

    useEffect(() => {
        if (secretsQuery.data) {
            setSettings(secretsQuery.data);
            return;
        }
        if (secretsQuery.isError) {
            setSettings(defaultSecretsSettings);
            setMessage('Secrets could not be loaded.');
        }
    }, [secretsQuery.data, secretsQuery.isError]);

    useEffect(() => {
        form.reset(settings);
    }, [form, settings]);

    const saveSecrets = () => {
        const currentSettings = form.state.values;
        void saveSecretsMutation.mutateAsync(currentSettings);
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
            <div className="settings-inline-actions settings-inline-actions--secrets-save">
                <ActionButton onClick={saveSecrets} variant="primary">
                    Save secrets
                </ActionButton>
            </div>
            {message ? (
                <p className="feedback-info" role="status">
                    {message}
                </p>
            ) : null}
        </section>
    );
};
