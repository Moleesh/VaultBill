/** @format */

import type { FC } from 'react';

import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import { FieldTypeSchema } from '../../db/startup/ConfigSchemas';
import type { FieldConfig } from './BuilderPageSupport';

type BuilderFieldDrawerProps = {
    readonly field: FieldConfig;
    readonly onChange: (field: FieldConfig) => void;
};

/** Renders the editable drawer for a single document or line-item field. */
export const BuilderFieldDrawer: FC<BuilderFieldDrawerProps> = ({ field, onChange }) => (
    <div className="form-grid">
        <label>
            <span>Field ID</span>
            <input
                value={field.FieldId}
                onChange={(event) => {
                    onChange({ ...field, FieldId: event.currentTarget.value.replace(/\W/gu, '') });
                }}
            />
        </label>
        <label>
            <span>Label</span>
            <input
                value={field.Label}
                onChange={(event) => {
                    onChange({ ...field, Label: event.currentTarget.value });
                }}
            />
        </label>
        <SearchableDropdown
            label="Type"
            value={field.Type}
            onChange={(value) => {
                const parsed = FieldTypeSchema.safeParse(value);
                if (!parsed.success) return;
                onChange({ ...field, Type: parsed.data });
            }}
            options={FieldTypeSchema.options.map((type) => ({ value: type, label: type }))}
        />
        <label>
            <span>Placeholder</span>
            <input
                value={field.Placeholder ?? ''}
                onChange={(event) => {
                    onChange({ ...field, Placeholder: event.currentTarget.value });
                }}
            />
        </label>
        <label>
            <span>Default value</span>
            <input
                value={typeof field.DefaultValue === 'string' ? field.DefaultValue : ''}
                onChange={(event) => {
                    onChange({ ...field, DefaultValue: event.currentTarget.value });
                }}
            />
        </label>
        <label>
            <span>Prefix</span>
            <input
                value={field.Prefix ?? ''}
                onChange={(event) => {
                    onChange({ ...field, Prefix: event.currentTarget.value });
                }}
            />
        </label>
        <label>
            <span>Suffix</span>
            <input
                value={field.Suffix ?? ''}
                onChange={(event) => {
                    onChange({ ...field, Suffix: event.currentTarget.value });
                }}
            />
        </label>
        <label>
            <span>Maximum length</span>
            <input
                min="1"
                type="number"
                value={field.MaxLength ?? ''}
                onChange={(event) => {
                    const maxLength = event.currentTarget.valueAsNumber;
                    onChange({
                        ...field,
                        MaxLength: Number.isNaN(maxLength) ? undefined : maxLength,
                    });
                }}
            />
        </label>
        <label>
            <span>Decimal precision</span>
            <input
                min="0"
                type="number"
                value={field.Precision ?? ''}
                onChange={(event) => {
                    const precision = event.currentTarget.valueAsNumber;
                    onChange({
                        ...field,
                        Precision: Number.isNaN(precision) ? undefined : precision,
                    });
                }}
            />
        </label>
        <label className="checkbox-field">
            <input
                checked={Boolean(field.Required)}
                onChange={(event) => {
                    onChange({ ...field, Required: event.currentTarget.checked });
                }}
                type="checkbox"
            />
            <span>Required</span>
        </label>
        <label className="checkbox-field">
            <input
                checked={field.Visible !== false}
                onChange={(event) => {
                    onChange({ ...field, Visible: event.currentTarget.checked });
                }}
                type="checkbox"
            />
            <span>Visible</span>
        </label>
        <label className="checkbox-field">
            <input
                checked={Boolean(field.ReadOnly)}
                onChange={(event) => {
                    onChange({ ...field, ReadOnly: event.currentTarget.checked });
                }}
                type="checkbox"
            />
            <span>Read only</span>
        </label>
        <label className="checkbox-field">
            <input
                checked={Boolean(field.Calculated)}
                onChange={(event) => {
                    onChange({
                        ...field,
                        Calculated: event.currentTarget.checked,
                        ReadOnly: event.currentTarget.checked || field.ReadOnly,
                    });
                }}
                type="checkbox"
            />
            <span>Calculated</span>
        </label>
        {field.Calculated ? (
            <label className="span-2">
                <span>Formula</span>
                <input
                    value={field.Formula ?? ''}
                    onChange={(event) => {
                        onChange({ ...field, Formula: event.currentTarget.value });
                    }}
                />
                <small>Examples: Quantity * Rate or SUMALL(Amount)</small>
            </label>
        ) : null}
    </div>
);
