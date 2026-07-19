/** @format */

import type { ComponentPropsWithoutRef, FC, ReactNode } from 'react';

type CheckboxFieldProps = Omit<ComponentPropsWithoutRef<'input'>, 'children' | 'type'> & {
    readonly hideLabel?: boolean | undefined;
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

export const CheckboxField: FC<CheckboxFieldProps> = ({
    hideLabel = false,
    label,
    note,
    requiredIndicator = false,
    wrapperClassName,
    ...inputProps
}) => (
    <label className={wrapperClassName ? `checkbox-field ${wrapperClassName}` : 'checkbox-field'}>
        <input {...inputProps} type="checkbox" />
        <span aria-hidden="true" className="checkbox-field-control" />
        <span className="checkbox-field-copy">
            <span
                className={
                    hideLabel
                        ? 'checkbox-field-label form-field-label--hidden'
                        : 'checkbox-field-label'
                }
            >
                {label}
                {requiredIndicator ? <RequiredIndicator /> : null}
            </span>
            {note ? <p className="field-note">{note}</p> : null}
        </span>
    </label>
);
