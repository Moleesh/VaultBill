/** @format */

import type { ComponentPropsWithoutRef, FC, ReactNode } from 'react';

type FieldWrapperProps = {
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
    readonly wrapperClassName?: string | undefined;
};

type TextFieldProps = Omit<ComponentPropsWithoutRef<'input'>, 'children'> & FieldControlProps;

type TextAreaFieldProps = Omit<ComponentPropsWithoutRef<'textarea'>, 'children'> &
    FieldControlProps;

type CheckboxFieldProps = Omit<ComponentPropsWithoutRef<'input'>, 'children' | 'type'> & {
    readonly label: ReactNode;
    readonly note?: ReactNode | undefined;
    readonly requiredIndicator?: boolean | undefined;
    readonly wrapperClassName?: string | undefined;
};

const RequiredIndicator: FC = () => (
    <span aria-hidden="true" className="required-indicator">
        *
    </span>
);

/** Shared labeled field wrapper with one consistent prop contract across forms. */
const FieldWrapper: FC<FieldWrapperProps> = ({
    children,
    hideLabel = false,
    label,
    note,
    requiredIndicator = false,
    wrapperClassName,
}) => (
    <label className={wrapperClassName ? `form-field ${wrapperClassName}` : 'form-field'}>
        <span
            className={hideLabel ? 'form-field-label form-field-label--hidden' : 'form-field-label'}
        >
            {label}
            {requiredIndicator ? <RequiredIndicator /> : null}
        </span>
        {children}
        {note ? <p className="field-note">{note}</p> : null}
    </label>
);

/** Shared single-line text input field. */
const TextField: FC<TextFieldProps> = ({
    invalid = false,
    hideLabel = false,
    label,
    note,
    requiredIndicator = false,
    wrapperClassName,
    ...inputProps
}) => (
    <FieldWrapper
        hideLabel={hideLabel}
        label={label}
        note={note}
        requiredIndicator={requiredIndicator}
        wrapperClassName={wrapperClassName}
    >
        <input {...inputProps} aria-invalid={invalid} />
    </FieldWrapper>
);

/** Shared multiline textarea field. */
const TextAreaField: FC<TextAreaFieldProps> = ({
    invalid = false,
    hideLabel = false,
    label,
    note,
    requiredIndicator = false,
    wrapperClassName,
    ...textareaProps
}) => (
    <FieldWrapper
        hideLabel={hideLabel}
        label={label}
        note={note}
        requiredIndicator={requiredIndicator}
        wrapperClassName={wrapperClassName}
    >
        <textarea {...textareaProps} aria-invalid={invalid} />
    </FieldWrapper>
);

/** Shared checkbox field with consistent label and note layout. */
const CheckboxField: FC<CheckboxFieldProps> = ({
    label,
    note,
    requiredIndicator = false,
    wrapperClassName,
    ...inputProps
}) => (
    <label className={wrapperClassName ? `checkbox-field ${wrapperClassName}` : 'checkbox-field'}>
        <input {...inputProps} type="checkbox" />
        <span>
            {label}
            {requiredIndicator ? <RequiredIndicator /> : null}
        </span>
        {note ? <p className="field-note">{note}</p> : null}
    </label>
);

/** Namespaced shared field primitives for consistent form composition. */
export const FormField = {
    CheckboxField,
    Wrapper: FieldWrapper,
    TextAreaField,
    TextField,
} as const;

export { CheckboxField, FieldWrapper, TextAreaField, TextField };
