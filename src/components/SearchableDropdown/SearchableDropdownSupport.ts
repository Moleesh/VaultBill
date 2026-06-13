/** @format */

import type { Dispatch, KeyboardEvent, RefObject, SetStateAction } from 'react';

import type { DropdownOption } from './SearchableDropdown';

export const normalizeDropdownSearch = (value: string): string =>
    value.trim().toLocaleLowerCase().replace(/\s+/gu, ' ');

export type DropdownMenuPlacement = {
    readonly left: string;
    readonly top: string;
    readonly width: string;
    readonly openDirection: 'above' | 'below';
};

export const getDropdownMenuPlacement = (
    rect: DOMRect,
    viewportHeight: number,
    viewportWidth: number,
): DropdownMenuPlacement => {
    const preferredHeight = Math.min(448, viewportHeight - 32);
    const belowSpace = viewportHeight - rect.bottom - 8;
    const aboveSpace = rect.top - 8;
    const openDirection: 'above' | 'below' =
        belowSpace >= Math.min(preferredHeight, 160) || belowSpace >= aboveSpace
            ? 'below'
            : 'above';
    const availableHeight = openDirection === 'above' ? aboveSpace : belowSpace;
    const boundedHeight = Math.max(16, Math.min(preferredHeight, availableHeight));
    const rawWidth = Math.max(rect.width, 280);
    const left = Math.min(Math.max(16, rect.left), Math.max(16, viewportWidth - rawWidth - 16));

    return {
        left: `${String(left)}px`,
        top: `${String(
            openDirection === 'above'
                ? Math.max(16, rect.top - boundedHeight - 8)
                : rect.bottom + 8,
        )}px`,
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
