/** @format */

import { addMonths, format, getDay, getDaysInMonth, parseISO, startOfMonth } from 'date-fns';
import { useEffect, useId, useRef, useState } from 'react';
import type { FC } from 'react';

import { AppDatePickerPopup } from './AppDatePickerPopup';
import { getDropdownMenuPlacement } from '../SearchableDropdown/SearchableDropdownSupport';

type AppDatePickerProps = {
    readonly label: string;
    readonly value: string;
    readonly onChange: (value: string) => void;
    readonly disabled?: boolean;
    readonly displayFormat?: string;
};

export const AppDatePicker: FC<AppDatePickerProps> = ({
    disabled = false,
    displayFormat = 'dd MMM yyyy',
    label,
    onChange,
    value,
}) => {
    const id = useId();
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const initialMonth = value ? startOfMonth(parseISO(value)) : startOfMonth(new Date());
    const [visibleMonth, setVisibleMonth] = useState(initialMonth);
    const [isOpen, setIsOpen] = useState(false);
    const daysInMonth = getDaysInMonth(visibleMonth);
    const leadingDays = (getDay(startOfMonth(visibleMonth)) + 6) % 7;

    const syncPopupPosition = () => {
        const rect = triggerRef.current?.getBoundingClientRect();
        const popup = popupRef.current;
        if (!rect || !popup) return;

        const placement = getDropdownMenuPlacement(rect, window.innerHeight, window.innerWidth);
        popup.style.left = placement.left;
        popup.style.width = placement.width;
        popup.style.top = placement.top;
        popup.style.bottom = placement.bottom;
        popup.style.maxHeight = placement.maxHeight;
        popup.dataset.openDirection = placement.openDirection;
    };

    useEffect(() => {
        if (!isOpen) return undefined;

        syncPopupPosition();

        const handleOutsideClick = (event: MouseEvent) => {
            const { target } = event;
            if (
                target instanceof Node &&
                !popupRef.current?.contains(target) &&
                !triggerRef.current?.contains(target)
            ) {
                setIsOpen(false);
            }
        };
        const handleScroll = (event: Event) => {
            const { target } = event;
            if (
                target instanceof Node &&
                (popupRef.current?.contains(target) || triggerRef.current?.contains(target))
            ) {
                return;
            }

            setIsOpen(false);
        };
        const handleResize = () => {
            syncPopupPosition();
        };

        document.addEventListener('mousedown', handleOutsideClick);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleResize);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen]);

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
            <span className="app-date-picker-label" id={`${id}-label`}>
                {label}
            </span>
            <button
                aria-expanded={isOpen}
                aria-haspopup="dialog"
                aria-labelledby={`${id}-label ${id}-value`}
                className="app-date-picker-trigger"
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
            {isOpen ? (
                <AppDatePickerPopup
                    daysInMonth={daysInMonth}
                    label={label}
                    leadingDays={leadingDays}
                    onChooseDate={chooseDate}
                    onClear={() => {
                        onChange('');
                        setIsOpen(false);
                        triggerRef.current?.focus();
                    }}
                    onNextMonth={() => {
                        setVisibleMonth((current) => addMonths(current, 1));
                    }}
                    onPreviousMonth={() => {
                        setVisibleMonth((current) => addMonths(current, -1));
                    }}
                    onToday={() => {
                        onChange(format(new Date(), 'yyyy-MM-dd'));
                        setIsOpen(false);
                        triggerRef.current?.focus();
                    }}
                    popupRef={popupRef}
                    value={value}
                    visibleMonth={visibleMonth}
                />
            ) : null}
        </div>
    );
};
