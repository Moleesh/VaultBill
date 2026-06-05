import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { FC, KeyboardEvent } from 'react';

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

const normalize = (value: string): string => value.trim().toLocaleLowerCase().replace(/\s+/gu, ' ');

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
  const [activeIndex, setActiveIndex] = useState(0);
  const selectedOption = options.find((option) => option.value === value);
  const normalizedQuery = normalize(query);
  const filteredOptions = options.filter((option) => {
    const searchText = [option.label, option.value, ...(option.keywords ?? [])].join(' ');
    return normalize(searchText).includes(normalizedQuery);
  });

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const rect = triggerRef.current?.getBoundingClientRect();
    const menu = menuRef.current;

    if (rect && menu) {
      menu.style.setProperty('--dropdown-left', `${String(rect.left)}px`);
      menu.style.setProperty('--dropdown-top', `${String(rect.bottom + 8)}px`);
      menu.style.setProperty('--dropdown-width', `${String(Math.max(rect.width, 280))}px`);
    }

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

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
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

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const lastIndex = Math.max(filteredOptions.length - 1, 0);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, lastIndex));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    }
    if (event.key === 'Home') setActiveIndex(0);
    if (event.key === 'End') setActiveIndex(lastIndex);
    if (event.key === 'Escape') {
      setIsOpen(false);
      triggerRef.current?.focus();
    }
    if (event.key === 'Enter') {
      const option = filteredOptions[activeIndex];
      if (option) chooseOption(option);
    }
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
          setIsOpen((current) => !current);
        }}
        ref={triggerRef}
        type="button"
      >
        <span id={`${id}-value`}>{loading ? 'Loading…' : (selectedOption?.label ?? 'Choose')}</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {isOpen && portalRoot
        ? createPortal(
            <div className="searchable-dropdown__menu" onKeyDown={handleKeyDown} ref={menuRef}>
              {options.length > 7 ? (
                <input
                  aria-label={`Search ${label}`}
                  autoFocus
                  onChange={(event) => {
                    setQuery(event.currentTarget.value);
                    setActiveIndex(0);
                  }}
                  placeholder="Search options"
                  value={query}
                />
              ) : null}
              <div aria-labelledby={`${id}-label`} role="listbox">
                {filteredOptions.length === 0 ? (
                  <p className="searchable-dropdown__empty">No matching options.</p>
                ) : (
                  filteredOptions.slice(0, 100).map((option, index) => (
                    <button
                      aria-selected={option.value === value}
                      className={index === activeIndex ? 'is-active' : ''}
                      disabled={option.disabled}
                      key={option.value}
                      onClick={() => {
                        chooseOption(option);
                      }}
                      role="option"
                      type="button"
                    >
                      <strong>{option.label}</strong>
                      {option.description ? <small>{option.description}</small> : null}
                    </button>
                  ))
                )}
              </div>
            </div>,
            portalRoot,
          )
        : null}
    </div>
  );
};
