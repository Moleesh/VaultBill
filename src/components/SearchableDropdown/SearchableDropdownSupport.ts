/** @format */

import type { Dispatch, KeyboardEvent, RefObject, SetStateAction } from 'react';

/** Shared searchable dropdown option shape used across compact picker inputs. */
export type DropdownOption = {
    readonly value: string;
    readonly label: string;
    readonly description?: string;
    readonly keywords?: readonly string[];
    readonly disabled?: boolean;
};

/** Normalizes dropdown search text for case-insensitive matching with collapsed spacing. */
export const normalizeDropdownSearch = (value: string): string =>
    value.trim().toLocaleLowerCase().replace(/\s+/gu, ' ');

/** Pixel-based menu placement returned for the floating searchable dropdown portal. */
export type DropdownMenuPlacement = {
    readonly left: string;
    readonly top: string;
    readonly bottom: string;
    readonly width: string;
    readonly maxHeight: string;
    readonly openDirection: 'above' | 'below';
};

export type DropdownMenuAlignment = 'left' | 'right';

/** Calculates the best floating menu position for the searchable dropdown trigger. */
export const getDropdownMenuPlacement = (
    rect: DOMRect,
    viewportHeight: number,
    viewportWidth: number,
    alignment: DropdownMenuAlignment = 'left',
): DropdownMenuPlacement => {
    const availableBelow = Math.max(0, viewportHeight - rect.bottom - 12);
    const availableAbove = Math.max(0, rect.top - 12);
    const rawWidth = Math.max(rect.width, 280);
    const preferredLeft = alignment === 'right' ? rect.right - rawWidth : rect.left;
    const left = Math.min(Math.max(16, preferredLeft), Math.max(16, viewportWidth - rawWidth - 16));
    const openDirection: 'below' | 'above' =
        availableBelow >= 220 || availableBelow >= availableAbove ? 'below' : 'above';
    const maxHeight = Math.min(
        352,
        Math.max(96, openDirection === 'below' ? availableBelow : availableAbove),
    );
    const top = openDirection === 'below' ? `${String(Math.max(12, rect.bottom + 1))}px` : 'auto';
    const bottom =
        openDirection === 'above'
            ? `${String(Math.max(12, viewportHeight - rect.top + 1))}px`
            : 'auto';

    return {
        left: `${String(left)}px`,
        maxHeight: `${String(maxHeight)}px`,
        bottom,
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

/** Creates the shared keyboard-navigation handler for the searchable dropdown menu. */
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
