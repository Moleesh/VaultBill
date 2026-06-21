/** @format */

import { format } from 'date-fns';
import type { RefObject } from 'react';

import { ActionButton } from '../ActionButton';

type AppDatePickerPopupProps = {
    readonly label: string;
    readonly value: string;
    readonly visibleMonth: Date;
    readonly daysInMonth: number;
    readonly leadingDays: number;
    readonly popupRef: RefObject<HTMLDivElement | null>;
    readonly onChooseDate: (day: number) => void;
    readonly onClear: () => void;
    readonly onNextMonth: () => void;
    readonly onPreviousMonth: () => void;
    readonly onToday: () => void;
};

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export const AppDatePickerPopup = ({
    daysInMonth,
    label,
    leadingDays,
    onChooseDate,
    onClear,
    onNextMonth,
    onPreviousMonth,
    onToday,
    popupRef,
    value,
    visibleMonth,
}: AppDatePickerPopupProps) => (
    <div
        aria-label={`${label} calendar`}
        className="app-date-picker-popup"
        role="dialog"
        ref={popupRef}
        onKeyDown={(event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClear();
            }
        }}
    >
        <header>
            <ActionButton aria-label="Previous month" onClick={onPreviousMonth}>
                ←
            </ActionButton>
            <strong>{format(visibleMonth, 'MMMM yyyy')}</strong>
            <ActionButton aria-label="Next month" onClick={onNextMonth}>
                →
            </ActionButton>
        </header>
        <div className="app-date-picker-weekdays" aria-hidden="true">
            {weekDays.map((day) => (
                <span key={day}>{day}</span>
            ))}
        </div>
        <div className="app-date-picker-days">
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
                    <ActionButton
                        aria-pressed={isoDate === value}
                        key={isoDate}
                        onClick={() => {
                            onChooseDate(day);
                        }}
                    >
                        {day}
                    </ActionButton>
                );
            })}
        </div>
        <footer>
            <ActionButton
                onClick={() => {
                    onClear();
                }}
            >
                Clear
            </ActionButton>
            <ActionButton
                onClick={() => {
                    onToday();
                }}
                variant="primary"
            >
                Today
            </ActionButton>
        </footer>
    </div>
);
