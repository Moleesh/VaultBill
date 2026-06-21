/** @format */

import { Plus, ShieldCheck, Trash2 } from 'lucide-react';
import type { FC, ReactNode } from 'react';

import { FormField } from '../../components/FormFields';
import { IconButton } from '../../components/IconButton';
import { IconOnlyButton } from '../../components/IconOnlyButton';

type SecretEntry = {
    readonly key: string;
    readonly value: string;
    readonly description: string;
};

export type SecretsSettings = {
    readonly secrets: readonly SecretEntry[];
};

export const secretValuesFromSettings = (
    secrets: readonly SecretEntry[],
): Readonly<Record<string, string>> =>
    Object.fromEntries(secrets.map((entry) => [`Secrets.${entry.key}`, entry.value]));

const emptySecret = (): SecretEntry => ({ key: '', value: '', description: '' });

export const defaultSecretsSettings: SecretsSettings = {
    secrets: [],
};

const toSecretEntry = (input: unknown): SecretEntry | undefined => {
    if (!input || typeof input !== 'object') return undefined;
    const raw = input as Record<string, unknown>;
    if (typeof raw.key !== 'string') return undefined;
    return {
        key: raw.key.trim(),
        value: typeof raw.value === 'string' ? raw.value : '',
        description: typeof raw.description === 'string' ? raw.description : '',
    };
};

export const normalizeSecretsSettings = (input: unknown): SecretsSettings => {
    if (!input || typeof input !== 'object') return defaultSecretsSettings;
    const raw = input as Record<string, unknown>;
    if (Array.isArray(raw.secrets)) {
        return {
            secrets: raw.secrets
                .map(toSecretEntry)
                .filter((entry): entry is SecretEntry => Boolean(entry)),
        };
    }
    return defaultSecretsSettings;
};

type SecretTableRowProps = {
    readonly entry: SecretEntry;
    readonly index: number;
    readonly onChange: (entry: SecretEntry) => void;
    readonly onRemove: () => void;
};

const SecretTableRow: FC<SecretTableRowProps> = ({ entry, index, onChange, onRemove }) => (
    <div className="secrets-key-value-row secrets-key-value-row--secrets">
        <FormField.TextField
            aria-label={`Secret key ${String(index + 1)}`}
            label="Key"
            onChange={(event) => {
                onChange({ ...entry, key: event.currentTarget.value });
            }}
            placeholder="SecretKey"
            value={entry.key}
        />
        <FormField.TextField
            aria-label={`Secret value ${String(index + 1)}`}
            label="Value"
            onChange={(event) => {
                onChange({ ...entry, value: event.currentTarget.value });
            }}
            placeholder="Enter value"
            value={entry.value}
        />
        <FormField.TextField
            aria-label={`Secret description ${String(index + 1)}`}
            label="Description"
            onChange={(event) => {
                onChange({ ...entry, description: event.currentTarget.value });
            }}
            placeholder="Optional note"
            value={entry.description}
        />
        <IconOnlyButton
            aria-label={`Remove secret ${String(index + 1)}`}
            icon={<Trash2 aria-hidden="true" size={16} />}
            onClick={onRemove}
        />
    </div>
);

type SecretsTableProps = {
    readonly secrets: readonly SecretEntry[];
    readonly onChange: (secrets: readonly SecretEntry[]) => void;
};

export const SecretsTable: FC<SecretsTableProps> = ({ secrets, onChange }) => (
    <div className="secrets-key-value-table" aria-label="Secrets configuration">
        <div className="secrets-key-value-table-header secrets-key-value-table-header--secrets">
            <span>Key</span>
            <span>Value</span>
            <span>Description</span>
            <span>Action</span>
        </div>
        {secrets.map((entry, index) => (
            <SecretTableRow
                entry={entry}
                index={index}
                key={`${entry.key || 'secret'}-${String(index)}`}
                onChange={(nextEntry) => {
                    const next = [...secrets];
                    next[index] = nextEntry;
                    onChange(next);
                }}
                onRemove={() => {
                    onChange(secrets.filter((_, secretIndex) => secretIndex !== index));
                }}
            />
        ))}
        <IconButton
            icon={<Plus aria-hidden="true" size={18} />}
            onClick={() => {
                onChange([...secrets, emptySecret()]);
            }}
            variant="secondary"
        >
            Add secret
        </IconButton>
    </div>
);

type SecretsSectionCardProps = {
    readonly title: string;
    readonly description: string;
    readonly children: ReactNode;
};

export const SecretsSectionCard: FC<SecretsSectionCardProps> = ({
    title,
    description,
    children,
}) => (
    <div className="settings-subsection">
        <div className="section-heading">
            <div>
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
            <ShieldCheck aria-hidden="true" />
        </div>
        {children}
    </div>
);
