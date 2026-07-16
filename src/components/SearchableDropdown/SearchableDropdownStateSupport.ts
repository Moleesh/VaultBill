/** @format */

import type { Dispatch, RefObject, SetStateAction } from 'react';
import { useEffect } from 'react';

import {
    type DropdownMenuAlignment,
    getDropdownMenuPlacement,
    normalizeDropdownSearch,
    type DropdownOption,
} from './SearchableDropdownSupport';

/** Filters dropdown options using normalized label, value, and keyword search text. */
export const getFilteredDropdownOptions = (
    options: readonly DropdownOption[],
    query: string,
): readonly DropdownOption[] => {
    const normalizedQuery = normalizeDropdownSearch(query);
    return options.filter((option) => {
        const searchText = [option.label, option.value, ...(option.keywords ?? [])].join(' ');
        return normalizeDropdownSearch(searchText).includes(normalizedQuery);
    });
};

/** Returns the preferred active option index when the dropdown opens. */
export const getInitialDropdownActiveIndex = (
    filteredOptions: readonly DropdownOption[],
    value: string,
): number =>
    Math.max(
        filteredOptions.findIndex((option) => option.value === value),
        filteredOptions.findIndex((option) => !option.disabled),
    );

/** Applies and keeps the floating dropdown menu aligned to its trigger button. */
export const useSyncSearchableDropdownMenu = ({
    alignment = 'left',
    isOpen,
    menuRef,
    onClose,
    triggerRef,
}: {
    readonly alignment?: DropdownMenuAlignment;
    readonly isOpen: boolean;
    readonly menuRef: RefObject<HTMLDivElement | null>;
    readonly onClose: () => void;
    readonly triggerRef: RefObject<HTMLButtonElement | null>;
}) => {
    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const syncMenuPosition = () => {
            const rect = triggerRef.current?.getBoundingClientRect();
            const menu = menuRef.current;

            if (!rect || !menu) return;

            const placement = getDropdownMenuPlacement(
                rect,
                window.innerHeight,
                window.innerWidth,
                alignment,
            );
            menu.style.left = placement.left;
            menu.style.width = placement.width;
            menu.style.top = placement.top;
            menu.style.bottom = placement.bottom;
            menu.style.maxHeight = placement.maxHeight;
            menu.dataset.openDirection = placement.openDirection;
        };

        syncMenuPosition();

        const handleOutsideClick = (event: MouseEvent) => {
            const { target } = event;
            if (
                target instanceof Node &&
                !menuRef.current?.contains(target) &&
                !triggerRef.current?.contains(target)
            ) {
                onClose();
            }
        };
        const handleScroll = (event: Event) => {
            const { target } = event;
            if (
                target instanceof Node &&
                (menuRef.current?.contains(target) || triggerRef.current?.contains(target))
            ) {
                return;
            }

            onClose();
        };

        document.addEventListener('mousedown', handleOutsideClick);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', syncMenuPosition);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', syncMenuPosition);
        };
    }, [alignment, isOpen, menuRef, onClose, triggerRef]);
};

/** Clears the transient query and active state together when the menu closes. */
export const resetSearchableDropdownState = (
    setQuery: Dispatch<SetStateAction<string>>,
    setActiveIndex: Dispatch<SetStateAction<number>>,
) => {
    setQuery('');
    setActiveIndex(-1);
};
