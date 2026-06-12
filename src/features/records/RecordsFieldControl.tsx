/** @format */

import type { FC } from 'react';

import type { ConfiguredFieldDefinition } from './RecordsPageSupport';
import { defaultFieldValue, isNumericField } from './RecordsPageSupport';

type RecordsFieldControlProps = {
    readonly disabled: boolean;
    readonly field: ConfiguredFieldDefinition;
    readonly onChange: (value: string) => void;
    readonly value: string;
};

/** Renders a configured document or line-item field with the shared input style. */
export const RecordsFieldControl: FC<RecordsFieldControlProps> = ({
    disabled,
    field,
    onChange,
    value,
}) => {
    if (field.Visible === false) return null;
    if (field.Type === 'Checkbox') {
        return (
            <label className="checkbox-field">
                <input
                    checked={value === 'true'}
                    disabled={disabled}
                    onChange={(event) => {
                        onChange(String(event.currentTarget.checked));
                    }}
                    type="checkbox"
                />
                <span>
                    {field.Label}
                    {field.Required ? ' *' : ''}
                </span>
            </label>
        );
    }
    const common = {
        disabled,
        maxLength: field.MaxLength,
        placeholder: field.Placeholder,
        readOnly: disabled || field.ReadOnly === true || field.Calculated === true,
        required: field.Required,
        value: value || defaultFieldValue(field),
    };
    return (
        <label>
            <span>
                {field.Label}
                {field.Required ? ' *' : ''}
            </span>
            {field.Type === 'Textarea' ? (
                <textarea
                    {...common}
                    onChange={(event) => {
                        onChange(event.currentTarget.value);
                    }}
                />
            ) : (
                <input
                    {...common}
                    inputMode={isNumericField(field) ? 'decimal' : undefined}
                    onChange={(event) => {
                        onChange(event.currentTarget.value);
                    }}
                    type={
                        field.Type === 'Date'
                            ? 'date'
                            : field.Type === 'DateTime'
                              ? 'datetime-local'
                              : 'text'
                    }
                />
            )}
        </label>
    );
};
