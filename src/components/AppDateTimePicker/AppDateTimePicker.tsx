/** @format */

/** Combined date and time picker for hosted operations and scheduled flows. */

import type { FC, ReactNode } from 'react';

import { FormField } from '../FormFields';
import { AppDatePicker } from '../AppDatePicker/AppDatePicker';

type AppDateTimePickerProps = {
    readonly disabled?: boolean;
    readonly hideLabel?: boolean;
    readonly label: string;
    readonly note?: ReactNode;
    readonly onChange: (value: string) => void;
    readonly requiredIndicator?: boolean;
    readonly value: string;
    readonly wrapperClassName?: string;
};

export const AppDateTimePicker: FC<AppDateTimePickerProps> = ({
    disabled = false,
    hideLabel = false,
    label,
    note,
    onChange,
    requiredIndicator = false,
    value,
    wrapperClassName,
}) => {
    const [date = '', time = '09:00'] = value.split('T');

    return (
        <FormField.Wrapper
            hideLabel={hideLabel}
            label={label}
            note={note}
            requiredIndicator={requiredIndicator}
            wrapperClassName={wrapperClassName}
        >
            <div className="app-date-time-picker">
                <AppDatePicker
                    disabled={disabled}
                    hideLabel
                    label={`${label} date`}
                    onChange={(nextDate) => {
                        onChange(nextDate ? `${nextDate}T${time || '09:00'}` : '');
                    }}
                    value={date}
                />
                <FormField.TextField
                    disabled={disabled}
                    hideLabel
                    label={`${label} time`}
                    onChange={(event) => {
                        onChange(date ? `${date}T${event.currentTarget.value}` : '');
                    }}
                    type="time"
                    value={time}
                />
            </div>
        </FormField.Wrapper>
    );
};
