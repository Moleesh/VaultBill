/** @format */

import { Plus, ShieldCheck, Trash2 } from 'lucide-react';
import type { FC } from 'react';

import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';

export type IntegrationField = {
    readonly key: string;
    readonly value: string;
};

export type IntegrationService = {
    readonly enabled: boolean;
    readonly provider: string;
    readonly fields: readonly IntegrationField[];
};

export type IntegrationSettings = {
    readonly gst: IntegrationService;
    readonly sms: IntegrationService;
};

export const providerOptions = {
    gst: [
        { value: 'local-gsp', label: 'Local GSP helper', description: 'Good for desktop testing' },
        { value: 'sandbox-gsp', label: 'Sandbox GSP', description: 'Use provider sandbox details' },
        { value: 'custom-gsp', label: 'Custom API', description: 'Enter your own endpoint' },
    ],
    sms: [
        { value: 'local-relay', label: 'Local relay', description: 'Simple desktop gateway' },
        {
            value: 'trial-provider',
            label: 'Trial SMS provider',
            description: 'Starter integration',
        },
        { value: 'custom-sms', label: 'Custom API', description: 'Use your own endpoint' },
    ],
} as const;

export const defaultIntegrationSettings: IntegrationSettings = {
    gst: { enabled: false, provider: '', fields: [] },
    sms: { enabled: false, provider: '', fields: [] },
};

export const normalizeIntegrationSettings = (input: unknown): IntegrationSettings => {
    if (!input || typeof input !== 'object') return defaultIntegrationSettings;
    const raw = input as Record<string, unknown>;
    if (typeof raw.gst === 'object' && typeof raw.sms === 'object') {
        return {
            gst: {
                enabled:
                    typeof (raw.gst as Record<string, unknown>).enabled === 'boolean'
                        ? ((raw.gst as Record<string, unknown>).enabled as boolean)
                        : false,
                provider:
                    typeof (raw.gst as Record<string, unknown>).provider === 'string'
                        ? String((raw.gst as Record<string, unknown>).provider)
                        : '',
                fields: Array.isArray((raw.gst as Record<string, unknown>).fields)
                    ? ((raw.gst as Record<string, unknown>).fields as readonly IntegrationField[])
                    : [],
            },
            sms: {
                enabled:
                    typeof (raw.sms as Record<string, unknown>).enabled === 'boolean'
                        ? ((raw.sms as Record<string, unknown>).enabled as boolean)
                        : false,
                provider:
                    typeof (raw.sms as Record<string, unknown>).provider === 'string'
                        ? String((raw.sms as Record<string, unknown>).provider)
                        : '',
                fields: Array.isArray((raw.sms as Record<string, unknown>).fields)
                    ? ((raw.sms as Record<string, unknown>).fields as readonly IntegrationField[])
                    : [],
            },
        };
    }
    return {
        gst: {
            enabled: typeof raw.gstEnabled === 'boolean' ? raw.gstEnabled : false,
            provider: typeof raw.gspProvider === 'string' ? raw.gspProvider : '',
            fields: [],
        },
        sms: {
            enabled: typeof raw.smsEnabled === 'boolean' ? raw.smsEnabled : false,
            provider: typeof raw.smsProvider === 'string' ? raw.smsProvider : '',
            fields: [],
        },
    };
};

const createField = (): IntegrationField => ({ key: '', value: '' });

type IntegrationServiceCardProps = {
    readonly title: string;
    readonly description: string;
    readonly providerValue: string;
    readonly service: IntegrationService;
    readonly onServiceChange: (service: IntegrationService) => void;
    readonly providerChoices: readonly {
        readonly value: string;
        readonly label: string;
        readonly description: string;
    }[];
};

export const IntegrationServiceCard: FC<IntegrationServiceCardProps> = ({
    title,
    description,
    providerValue,
    service,
    onServiceChange,
    providerChoices,
}) => (
    <div className="settings-subsection">
        <div className="section-heading">
            <div>
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
            <ShieldCheck aria-hidden="true" />
        </div>
        <label className="checkbox-field">
            <input
                checked={service.enabled}
                onChange={(event) => {
                    onServiceChange({ ...service, enabled: event.currentTarget.checked });
                }}
                type="checkbox"
            />
            <span>Enable {title}</span>
        </label>
        <SearchableDropdown
            label="Provider"
            onChange={(value) => {
                onServiceChange({ ...service, provider: value });
            }}
            options={providerChoices}
            value={providerValue}
        />
        <div className="integration-key-value-table" aria-label={`${title} configuration`}>
            <div className="integration-key-value-table__header">
                <span>Key</span>
                <span>Value</span>
                <span>Action</span>
            </div>
            {service.fields.map((field, index) => (
                <div className="integration-key-value-row" key={`${title}-${String(index)}`}>
                    <label>
                        <span>Key</span>
                        <input
                            aria-label={`${title} field key ${String(index + 1)}`}
                            onChange={(event) => {
                                const next = [...service.fields];
                                next[index] = { ...field, key: event.currentTarget.value };
                                onServiceChange({ ...service, fields: next });
                            }}
                            placeholder="apiKey"
                            value={field.key}
                        />
                    </label>
                    <label>
                        <span>Value</span>
                        <input
                            aria-label={`${title} field value ${String(index + 1)}`}
                            onChange={(event) => {
                                const next = [...service.fields];
                                next[index] = { ...field, value: event.currentTarget.value };
                                onServiceChange({ ...service, fields: next });
                            }}
                            placeholder="Enter value"
                            value={field.value}
                        />
                    </label>
                    <button
                        aria-label={`Remove ${title} field ${String(index + 1)}`}
                        onClick={() => {
                            onServiceChange({
                                ...service,
                                fields: service.fields.filter(
                                    (_, fieldIndex) => fieldIndex !== index,
                                ),
                            });
                        }}
                        type="button"
                    >
                        <Trash2 aria-hidden="true" size={16} />
                    </button>
                </div>
            ))}
            <button
                className="button-file"
                onClick={() => {
                    onServiceChange({ ...service, fields: [...service.fields, createField()] });
                }}
                type="button"
            >
                <Plus aria-hidden="true" size={18} /> Add field
            </button>
        </div>
    </div>
);
