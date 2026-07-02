/** @format */

import type {
    ChangeEventHandler,
    Dispatch,
    FC,
    KeyboardEvent,
    RefObject,
    SetStateAction,
} from 'react';
import { createPortal } from 'react-dom';

import { ActionButton } from '../ActionButton';
import { FormField } from '../FormFields';
import type { DropdownOption } from './SearchableDropdownSupport';

type SearchableDropdownMenuProps = {
    readonly activeIndex: number;
    readonly filteredOptions: readonly DropdownOption[];
    readonly id: string;
    readonly label: string;
    readonly menuRef: RefObject<HTMLDivElement | null>;
    readonly onChoose: (option: DropdownOption) => void;
    readonly onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
    readonly onQueryChange: ChangeEventHandler<HTMLInputElement>;
    readonly options: readonly DropdownOption[];
    readonly portalRoot: HTMLElement | null;
    readonly query: string;
    readonly setActiveIndex: Dispatch<SetStateAction<number>>;
    readonly value: string;
};

/** Renders the searchable dropdown menu inside the shared portal root. */
export const SearchableDropdownMenu: FC<SearchableDropdownMenuProps> = ({
    activeIndex,
    filteredOptions,
    id,
    label,
    menuRef,
    onChoose,
    onKeyDown,
    onQueryChange,
    options,
    portalRoot,
    query,
    setActiveIndex,
    value,
}) => {
    if (!portalRoot) return null;

    return createPortal(
        <div
            className="searchable-dropdown-menu"
            onKeyDown={onKeyDown}
            onMouseLeave={() => {
                setActiveIndex(-1);
            }}
            ref={menuRef}
        >
            {options.length > 7 ? (
                <FormField.TextField
                    autoFocus
                    hideLabel
                    label={`Search ${label}`}
                    onChange={onQueryChange}
                    placeholder="Search options"
                    value={query}
                    wrapperClassName="searchable-dropdown-search"
                />
            ) : null}
            <div aria-labelledby={`${id}-label`} role="listbox">
                {filteredOptions.length === 0 ? (
                    <p className="searchable-dropdown-empty">No matching options.</p>
                ) : (
                    filteredOptions.slice(0, 100).map((option, index) => (
                        <ActionButton
                            aria-selected={option.value === value}
                            className={index === activeIndex ? 'is-active' : ''}
                            disabled={option.disabled}
                            onMouseEnter={() => {
                                setActiveIndex(index);
                            }}
                            key={option.value}
                            onClick={() => {
                                onChoose(option);
                            }}
                            role="option"
                        >
                            <strong>
                                {option.value === value ? <span aria-hidden="true">✓ </span> : null}
                                {option.label}
                            </strong>
                            {option.description ? <small>{option.description}</small> : null}
                        </ActionButton>
                    ))
                )}
            </div>
        </div>,
        portalRoot,
    );
};
