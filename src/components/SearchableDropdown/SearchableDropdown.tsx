/** @format */

/** Searchable option picker used for compact form selection across the app. */

import { ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import type { FC } from 'react';

import { SearchableDropdownMenu } from './SearchableDropdownMenu';
import {
    createSearchableDropdownKeyDownHandler,
    getDropdownMenuPlacement,
    normalizeDropdownSearch,
} from './SearchableDropdownSupport';

export type DropdownOption = {
    readonly value: string;
    readonly label: string;
    readonly description?: string;
    readonly keywords?: readonly string[];
    readonly disabled?: boolean;
};

type SearchableDropdownProps = {
    readonly label: string;
    readonly options: readonly DropdownOption[];
    readonly value: string;
    readonly onChange: (value: string) => void;
    readonly loading?: boolean;
};

export const SearchableDropdown: FC<SearchableDropdownProps> = ({
    label,
    loading = false,
    onChange,
    options,
    value,
}) => {
    const id = useId();
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(-1);
    const selectedOption = options.find((option) => option.value === value);
    const normalizedQuery = normalizeDropdownSearch(query);
    const filteredOptions = options.filter((option) => {
        const searchText = [option.label, option.value, ...(option.keywords ?? [])].join(' ');
        return normalizeDropdownSearch(searchText).includes(normalizedQuery);
    });

    const syncMenuPosition = () => {
        const rect = triggerRef.current?.getBoundingClientRect();
        const menu = menuRef.current;

        if (!rect || !menu) return;

        const placement = getDropdownMenuPlacement(rect, window.innerHeight, window.innerWidth);
        menu.style.setProperty('--dropdown-left', placement.left);
        menu.style.setProperty('--dropdown-width', placement.width);
        menu.style.setProperty('--dropdown-top', placement.top);
        menu.dataset.openDirection = placement.openDirection;
    };

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        syncMenuPosition();

        const handleOutsideClick = (event: MouseEvent) => {
            const { target } = event;
            if (
                target instanceof Node &&
                !menuRef.current?.contains(target) &&
                !triggerRef.current?.contains(target)
            ) {
                setIsOpen(false);
            }
        };
        const handleScroll = () => {
            setIsOpen(false);
        };
        const handleResize = () => {
            syncMenuPosition();
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

    const chooseOption = (option: DropdownOption) => {
        if (option.disabled) {
            return;
        }

        onChange(option.value);
        setIsOpen(false);
        setQuery('');
        triggerRef.current?.focus();
    };

    const portalRoot = document.getElementById('portal-root');

    return (
        <div className="searchable-dropdown">
            <span className="searchable-dropdown__label" id={`${id}-label`}>
                {label}
            </span>
            <button
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-labelledby={`${id}-label ${id}-value`}
                className="searchable-dropdown__trigger"
                disabled={loading}
                onClick={() => {
                    setIsOpen((current) => {
                        const next = !current;
                        if (next) {
                            setActiveIndex(
                                Math.max(
                                    filteredOptions.findIndex((option) => option.value === value),
                                    filteredOptions.findIndex((option) => !option.disabled),
                                ),
                            );
                        }
                        return next;
                    });
                }}
                ref={triggerRef}
                type="button"
            >
                <span id={`${id}-value`}>
                    {loading ? 'Loading…' : (selectedOption?.label ?? 'Choose')}
                </span>
                <ChevronDown aria-hidden="true" className="searchable-dropdown__caret" size={16} />
            </button>
            {isOpen ? (
                <SearchableDropdownMenu
                    activeIndex={activeIndex}
                    filteredOptions={filteredOptions}
                    id={id}
                    label={label}
                    menuRef={menuRef}
                    onChoose={chooseOption}
                    onKeyDown={createSearchableDropdownKeyDownHandler({
                        activeIndex,
                        filteredOptions,
                        onChoose: chooseOption,
                        onClose: () => {
                            setIsOpen(false);
                        },
                        setActiveIndex,
                        triggerRef,
                    })}
                    onQueryChange={(event) => {
                        setQuery(event.currentTarget.value);
                        setActiveIndex(-1);
                    }}
                    options={options}
                    portalRoot={portalRoot}
                    query={query}
                    setActiveIndex={setActiveIndex}
                    value={value}
                />
            ) : null}
        </div>
    );
};
