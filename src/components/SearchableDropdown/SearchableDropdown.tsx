/** @format */

/** Searchable option picker used for compact form selection across the app. */

import type { FC, ReactNode } from 'react';
import { useId, useRef, useState } from 'react';

import { ChevronDown } from 'lucide-react';

import { ActionButton } from '../ActionButton';
import { FormField } from '../FormFields';
import { SearchableDropdownMenu } from './SearchableDropdownMenu';
import {
    getFilteredDropdownOptions,
    getInitialDropdownActiveIndex,
    resetSearchableDropdownState,
    useSyncSearchableDropdownMenu,
} from './SearchableDropdownStateSupport';
import {
    createSearchableDropdownKeyDownHandler,
    type DropdownOption,
} from './SearchableDropdownSupport';

type SearchableDropdownProps = {
    readonly disabled?: boolean;
    readonly hideLabel?: boolean;
    readonly invalid?: boolean;
    readonly label: string;
    readonly note?: ReactNode;
    readonly options: readonly DropdownOption[];
    readonly onChange: (value: string) => void;
    readonly loading?: boolean;
    readonly requiredIndicator?: boolean;
    readonly value: string;
    readonly wrapperClassName?: string;
};

/** Renders a searchable select control with shared form-field labeling and portal menu behavior. */
export const SearchableDropdown: FC<SearchableDropdownProps> = ({
    disabled = false,
    hideLabel = false,
    invalid = false,
    label,
    loading = false,
    note,
    onChange,
    options,
    requiredIndicator = false,
    value,
    wrapperClassName,
}) => {
    const id = useId();
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(-1);
    const selectedOption = options.find((option) => option.value === value);
    const filteredOptions = getFilteredDropdownOptions(options, query);
    const closeDropdown = () => {
        setIsOpen(false);
        resetSearchableDropdownState(setQuery, setActiveIndex);
    };

    useSyncSearchableDropdownMenu({
        isOpen,
        menuRef,
        onClose: closeDropdown,
        triggerRef,
    });

    const chooseOption = (option: DropdownOption) => {
        if (option.disabled) {
            return;
        }

        onChange(option.value);
        closeDropdown();
        triggerRef.current?.focus();
    };

    const portalRoot = document.getElementById('portal-root');
    const selectedLabel = loading ? 'Loading…' : (selectedOption?.label ?? 'Choose');
    const isDisabled = disabled || loading;

    return (
        <FormField.Wrapper
            hideLabel={hideLabel}
            label={label}
            note={note}
            requiredIndicator={requiredIndicator}
            wrapperClassName={wrapperClassName}
        >
            <div className="searchable-dropdown">
                <ActionButton
                    aria-label={`${label} ${selectedLabel}`}
                    aria-invalid={invalid}
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    className="searchable-dropdown-trigger"
                    disabled={isDisabled}
                    onClick={() => {
                        if (isDisabled) {
                            return;
                        }
                        setIsOpen((current) => {
                            const next = !current;
                            if (next) {
                                setActiveIndex(
                                    getInitialDropdownActiveIndex(filteredOptions, value),
                                );
                            } else {
                                resetSearchableDropdownState(setQuery, setActiveIndex);
                            }
                            return next;
                        });
                    }}
                    ref={triggerRef}
                >
                    <span id={`${id}-value`}>{selectedLabel}</span>
                    <ChevronDown
                        aria-hidden="true"
                        className="searchable-dropdown-caret"
                        size={16}
                    />
                </ActionButton>
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
                                closeDropdown();
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
        </FormField.Wrapper>
    );
};

export type { DropdownOption } from './SearchableDropdownSupport';
