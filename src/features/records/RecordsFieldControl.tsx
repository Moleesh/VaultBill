/** @format */

import type { FC } from 'react';

import { AppDatePicker } from '../../components/AppDatePicker/AppDatePicker';
import { AppDateTimePicker } from '../../components/AppDateTimePicker/AppDateTimePicker';
import { FormField } from '../../components/FormFields';
import type { ConfiguredFieldDefinition } from './RecordsPageSupport';
import { defaultFieldValue, isNumericField } from './RecordsPageSupport';

type RecordsFieldControlProps = {
    readonly disabled: boolean;
    readonly field: ConfiguredFieldDefinition;
    readonly hideLabel?: boolean | undefined;
    readonly onChange: (value: string) => void;
    readonly value: string;
    readonly wrapperClassName?: string | undefined;
};

/** Renders a configured document or line-item field with the shared input style. */
export const RecordsFieldControl: FC<RecordsFieldControlProps> = ({
    disabled,
    field,
    hideLabel = false,
    onChange,
    value,
    wrapperClassName,
}) => {
    if (field.Visible === false) return null;
    if (field.Type === 'Checkbox') {
        return (
            <FormField.CheckboxField
                checked={value === 'true'}
                disabled={disabled}
                hideLabel={hideLabel}
                label={field.Label}
                onChange={(event) => {
                    onChange(String(event.currentTarget.checked));
                }}
                requiredIndicator={field.Required}
                wrapperClassName={wrapperClassName}
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
        wrapperClassName,
    };
    if (field.Type === 'Date') {
        return (
            <AppDatePicker
                disabled={disabled}
                hideLabel={hideLabel}
                label={field.Label}
                onChange={onChange}
                requiredIndicator={field.Required === true}
                value={common.value}
            />
        );
    }
    if (field.Type === 'DateTime') {
        return (
            <AppDateTimePicker
                disabled={disabled}
                hideLabel={hideLabel}
                label={field.Label}
                onChange={onChange}
                requiredIndicator={field.Required === true}
                value={common.value}
            />
        );
    }
    return field.Type === 'Textarea' ? (
        <FormField.TextAreaField
            {...common}
            hideLabel={hideLabel}
            label={field.Label}
            onChange={(event) => {
                onChange(event.currentTarget.value);
            }}
            requiredIndicator={field.Required}
        />
    ) : (
        <FormField.TextField
            {...common}
            hideLabel={hideLabel}
            inputMode={isNumericField(field) ? 'decimal' : undefined}
            label={field.Label}
            onChange={(event) => {
                onChange(event.currentTarget.value);
            }}
            requiredIndicator={field.Required}
            type="text"
        />
    );
};
