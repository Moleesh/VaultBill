/** @format */

import type { ComponentPropsWithoutRef, FC, ReactNode } from 'react';
import { useId, useState } from 'react';

import { Eye, EyeOff } from 'lucide-react';

import { CheckboxField } from './FormCheckboxField';
import { IconOnlyButton } from './IconOnlyButton';

type FieldWrapperProps = {
    readonly as?: 'div' | 'label' | undefined;
    readonly children: ReactNode;
    readonly hideLabel?: boolean | undefined;
    readonly label: ReactNode;
    readonly note?: ReactNode | undefined;
    readonly requiredIndicator?: boolean | undefined;
    readonly wrapperClassName?: string | undefined;
};

type FieldControlProps = {
    readonly invalid?: boolean | undefined;
    readonly hideLabel?: boolean | undefined;
    readonly label: ReactNode;
    readonly note?: ReactNode | undefined;
    readonly requiredIndicator?: boolean | undefined;
    readonly trailingAdornment?: ReactNode | undefined;
    readonly wrapperClassName?: string | undefined;
};

type TextFieldProps = Omit<ComponentPropsWithoutRef<'input'>, 'children'> & FieldControlProps;
type PasswordFieldProps = Omit<TextFieldProps, 'type'>;

type TextAreaFieldProps = Omit<ComponentPropsWithoutRef<'textarea'>, 'children'> &
    FieldControlProps;

const RequiredIndicator: FC = () => (
    <span aria-hidden="true" className="required-indicator">
        *
    </span>
);

const FieldWrapper: FC<FieldWrapperProps> = ({
    as = 'label',
    children,
    hideLabel = false,
    label,
    note,
    requiredIndicator = false,
    wrapperClassName,
}) => {
    const WrapperTag = as;

    return (
        <WrapperTag className={wrapperClassName ? `form-field ${wrapperClassName}` : 'form-field'}>
            <span
                className={
                    hideLabel ? 'form-field-label form-field-label--hidden' : 'form-field-label'
                }
            >
                {label}
                {requiredIndicator ? <RequiredIndicator /> : null}
            </span>
            {children}
            {note ? <p className="field-note">{note}</p> : null}
        </WrapperTag>
    );
};

const TextField: FC<TextFieldProps> = ({
    id,
    invalid = false,
    hideLabel = false,
    label,
    note,
    requiredIndicator = false,
    trailingAdornment,
    wrapperClassName,
    ...inputProps
}) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const labelId = `${fieldId}-label`;

    return (
        <FieldWrapper
            hideLabel={hideLabel}
            label={<span id={labelId}>{label}</span>}
            note={note}
            requiredIndicator={requiredIndicator}
            wrapperClassName={wrapperClassName}
        >
            <span
                className={
                    trailingAdornment
                        ? 'field-input-shell has-trailing-adornment'
                        : 'field-input-shell'
                }
            >
                <input
                    {...inputProps}
                    aria-invalid={invalid}
                    aria-labelledby={inputProps['aria-labelledby'] ?? labelId}
                    id={fieldId}
                />
                {trailingAdornment ? (
                    <span className="field-trailing-adornment">{trailingAdornment}</span>
                ) : null}
            </span>
        </FieldWrapper>
    );
};

const TextAreaField: FC<TextAreaFieldProps> = ({
    id,
    invalid = false,
    hideLabel = false,
    label,
    note,
    requiredIndicator = false,
    wrapperClassName,
    ...textareaProps
}) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const labelId = `${fieldId}-label`;

    return (
        <FieldWrapper
            hideLabel={hideLabel}
            label={<span id={labelId}>{label}</span>}
            note={note}
            requiredIndicator={requiredIndicator}
            wrapperClassName={wrapperClassName}
        >
            <textarea
                {...textareaProps}
                aria-invalid={invalid}
                aria-labelledby={textareaProps['aria-labelledby'] ?? labelId}
                id={fieldId}
            />
        </FieldWrapper>
    );
};

const PasswordField: FC<PasswordFieldProps> = (props) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <TextField
            {...props}
            trailingAdornment={
                <IconOnlyButton
                    aria-label={isVisible ? 'Hide password' : 'Show password'}
                    className="password-visibility-toggle"
                    icon={
                        isVisible ? (
                            <EyeOff aria-hidden="true" size={16} />
                        ) : (
                            <Eye aria-hidden="true" size={16} />
                        )
                    }
                    onClick={() => {
                        setIsVisible((current) => !current);
                    }}
                    title={isVisible ? 'Hide password' : 'Show password'}
                    type="button"
                />
            }
            type={isVisible ? 'text' : 'password'}
            wrapperClassName={
                props.wrapperClassName
                    ? `${props.wrapperClassName} form-field--password`
                    : 'form-field--password'
            }
        />
    );
};

export const FormField = {
    CheckboxField,
    Wrapper: FieldWrapper,
    PasswordField,
    TextAreaField,
    TextField,
} as const;

export { CheckboxField, FieldWrapper, PasswordField, TextAreaField, TextField };
