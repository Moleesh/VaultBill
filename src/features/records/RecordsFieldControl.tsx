/** @format */

import type { FC } from 'react';

import { FormField } from '../../components/FormFields';
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
            <FormField.CheckboxField
                checked={value === 'true'}
                disabled={disabled}
                label={field.Label}
                onChange={(event) => {
                    onChange(String(event.currentTarget.checked));
                }}
                requiredIndicator={field.Required}
            />
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
    return field.Type === 'Textarea' ? (
        <FormField.TextAreaField
            {...common}
            label={field.Label}
            onChange={(event) => {
                onChange(event.currentTarget.value);
            }}
            requiredIndicator={field.Required}
        />
    ) : (
        <FormField.TextField
            {...common}
            inputMode={isNumericField(field) ? 'decimal' : undefined}
            label={field.Label}
            onChange={(event) => {
                onChange(event.currentTarget.value);
            }}
            requiredIndicator={field.Required}
            type={
                field.Type === 'Date'
                    ? 'date'
                    : field.Type === 'DateTime'
                      ? 'datetime-local'
                      : 'text'
            }
        />
    );
};
