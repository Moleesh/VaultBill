/** @format */

import type { Dispatch, KeyboardEvent, RefObject, SetStateAction } from 'react';

import type { DropdownOption } from './SearchableDropdown';

export const normalizeDropdownSearch = (value: string): string =>
    value.trim().toLocaleLowerCase().replace(/\s+/gu, ' ');

export type DropdownMenuPlacement = {
    readonly left: string;
    readonly top: string;
    readonly width: string;
    readonly maxHeight: string;
    readonly openDirection: 'above' | 'below';
};

export const getDropdownMenuPlacement = (
    rect: DOMRect,
    viewportHeight: number,
    viewportWidth: number,
): DropdownMenuPlacement => {
    const availableBelow = Math.max(0, viewportHeight - rect.bottom - 12);
    const availableAbove = Math.max(0, rect.top - 12);
    const rawWidth = Math.max(rect.width, 280);
    const left = Math.min(Math.max(16, rect.left), Math.max(16, viewportWidth - rawWidth - 16));
    const openDirection = availableBelow >= 72 || availableBelow >= availableAbove ? 'below' : 'above';
    const availableSpace = openDirection === 'below' ? availableBelow : availableAbove;
    const maxHeight = Math.max(160, Math.min(352, availableSpace));
    const top =
        openDirection === 'below'
            ? `${String(Math.max(12, rect.bottom + 4))}px`
            : `${String(Math.max(12, rect.top - maxHeight - 4))}px`;

    return {
        left: `${String(left)}px`,
        maxHeight: `${String(maxHeight)}px`,
        top,
        width: `${String(rawWidth)}px`,
        openDirection,
    };
};

type SearchableDropdownKeyDownProps = {
    readonly activeIndex: number;
    readonly filteredOptions: readonly DropdownOption[];
    readonly onChoose: (option: DropdownOption) => void;
    readonly onClose: () => void;
    readonly setActiveIndex: Dispatch<SetStateAction<number>>;
    readonly triggerRef: RefObject<HTMLButtonElement | null>;
};

export const createSearchableDropdownKeyDownHandler = ({
    activeIndex,
    filteredOptions,
    onChoose,
    onClose,
    setActiveIndex,
    triggerRef,
}: SearchableDropdownKeyDownProps) => {
    return (event: KeyboardEvent<HTMLDivElement>) => {
        const lastIndex = Math.max(filteredOptions.length - 1, 0);

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((index) => Math.min(index < 0 ? 0 : index + 1, lastIndex));
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index < 0 ? lastIndex : index - 1, 0));
        }
        if (event.key === 'Home') setActiveIndex(0);
        if (event.key === 'End') setActiveIndex(lastIndex);
        if (event.key === 'Escape') {
            onClose();
            triggerRef.current?.focus();
        }
        if (event.key === 'Enter') {
            const option =
                filteredOptions[activeIndex] ??
                filteredOptions.find((candidate) => !candidate.disabled);
            if (option) onChoose(option);
        }
    };
};
