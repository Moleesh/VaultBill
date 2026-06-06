import type { FC } from 'react';

import { AppDatePicker } from '../AppDatePicker/AppDatePicker';

type AppDateTimePickerProps = {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly disabled?: boolean;
};

export const AppDateTimePicker: FC<AppDateTimePickerProps> = ({
  disabled = false,
  label,
  onChange,
  value,
}) => {
  const [date = '', time = '09:00'] = value.split('T');

  return (
    <div className="app-date-time-picker">
      <AppDatePicker
        disabled={disabled}
        label={label}
        onChange={(nextDate) => {
          onChange(nextDate ? `${nextDate}T${time || '09:00'}` : '');
        }}
        value={date}
      />
      <label>
        <span>Time</span>
        <input
          disabled={disabled}
          onChange={(event) => {
            onChange(date ? `${date}T${event.currentTarget.value}` : '');
          }}
          type="time"
          value={time}
        />
      </label>
    </div>
  );
};
