import { addMonths, format, getDay, getDaysInMonth, parseISO, startOfMonth } from 'date-fns';
import { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { FC } from 'react';

type AppDatePickerProps = {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly disabled?: boolean;
  readonly displayFormat?: string;
};

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export const AppDatePicker: FC<AppDatePickerProps> = ({
  disabled = false,
  displayFormat = 'dd MMM yyyy',
  label,
  onChange,
  value,
}) => {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const initialMonth = value ? startOfMonth(parseISO(value)) : startOfMonth(new Date());
  const [visibleMonth, setVisibleMonth] = useState(initialMonth);
  const [isOpen, setIsOpen] = useState(false);
  const portalRoot = document.getElementById('portal-root');
  const daysInMonth = getDaysInMonth(visibleMonth);
  const leadingDays = (getDay(startOfMonth(visibleMonth)) + 6) % 7;

  const chooseDate = (day: number) => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const selectedDate = new Date(year, month, day);
    onChange(format(selectedDate, 'yyyy-MM-dd'));
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className="app-date-picker">
      <span className="app-date-picker__label" id={`${id}-label`}>
        {label}
      </span>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-labelledby={`${id}-label ${id}-value`}
        className="app-date-picker__trigger"
        disabled={disabled}
        onClick={() => {
          setIsOpen((current) => !current);
        }}
        ref={triggerRef}
        type="button"
      >
        <span id={`${id}-value`}>
          {value ? format(parseISO(value), displayFormat) : 'Choose date'}
        </span>
        <span aria-hidden="true">▣</span>
      </button>
      {isOpen && portalRoot
        ? createPortal(
            <div aria-label={`${label} calendar`} className="app-date-picker__popup" role="dialog">
              <header>
                <button
                  aria-label="Previous month"
                  onClick={() => {
                    setVisibleMonth((current) => addMonths(current, -1));
                  }}
                  type="button"
                >
                  ←
                </button>
                <strong>{format(visibleMonth, 'MMMM yyyy')}</strong>
                <button
                  aria-label="Next month"
                  onClick={() => {
                    setVisibleMonth((current) => addMonths(current, 1));
                  }}
                  type="button"
                >
                  →
                </button>
              </header>
              <div className="app-date-picker__weekdays" aria-hidden="true">
                {weekDays.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="app-date-picker__days">
                {Array.from({ length: leadingDays }, (_, index) => (
                  <span key={`empty-${index.toString()}`} />
                ))}
                {Array.from({ length: daysInMonth }, (_, index) => {
                  const day = index + 1;
                  const isoDate = format(
                    new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day),
                    'yyyy-MM-dd',
                  );

                  return (
                    <button
                      aria-pressed={isoDate === value}
                      key={isoDate}
                      onClick={() => {
                        chooseDate(day);
                      }}
                      type="button"
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              <footer>
                <button
                  onClick={() => {
                    onChange('');
                    setIsOpen(false);
                  }}
                  type="button"
                >
                  Clear
                </button>
                <button
                  className="button-primary"
                  onClick={() => {
                    onChange(format(new Date(), 'yyyy-MM-dd'));
                    setIsOpen(false);
                  }}
                  type="button"
                >
                  Today
                </button>
              </footer>
            </div>,
            portalRoot,
          )
        : null}
    </div>
  );
};
