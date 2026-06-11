/** @format */

/** Shared helper card and text patterns for inline guidance across the app. */

import { useEffect, useState } from 'react';
import type { FC } from 'react';

import { useCapabilities } from '../capability/CapabilityContext';
import { getHelpSections } from '../help/HelpContent';
import type { Role } from '../types/AppTypes';
import { AppDrawer } from './AppDrawer/AppDrawer';
import { AppSheet } from './AppSheet/AppSheet';

type ContextualHelpProps = {
    readonly isOpen: boolean;
    readonly page: string;
    readonly role: Role;
    readonly onClose: () => void;
    readonly onOpen: () => void;
};

export const ContextualHelp: FC<ContextualHelpProps> = ({
    isOpen,
    onClose,
    onOpen,
    page,
    role,
}) => {
    const capabilities = useCapabilities();
    const [query, setQuery] = useState('');
    const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches);
    const sections = getHelpSections(page, role, capabilities);
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const filteredSections = sections.filter((section) =>
        [section.title, section.body, ...section.keywords]
            .join(' ')
            .toLocaleLowerCase()
            .includes(normalizedQuery),
    );

    useEffect(() => {
        const mobileQuery = window.matchMedia('(max-width: 768px)');

        const handleChange = (event: MediaQueryListEvent) => {
            setIsMobile(event.matches);
        };

        mobileQuery.addEventListener('change', handleChange);
        return () => {
            mobileQuery.removeEventListener('change', handleChange);
        };
    }, []);

    useEffect(() => {
        const handleShortcut = (event: KeyboardEvent) => {
            if (event.key === 'F1' || (event.ctrlKey && event.key === '/')) {
                event.preventDefault();
                onOpen();
            }
        };

        document.addEventListener('keydown', handleShortcut);
        return () => {
            document.removeEventListener('keydown', handleShortcut);
        };
    }, [onOpen]);

    const content = (
        <>
            <label className="help-search">
                <span>Search help</span>
                <input
                    onChange={(event) => {
                        setQuery(event.currentTarget.value);
                    }}
                    placeholder="Search actions and topics"
                    value={query}
                />
            </label>
            <div className="help-sections">
                {filteredSections.map((section) => (
                    <section key={section.title}>
                        <h3>{section.title}</h3>
                        <p>{section.body}</p>
                    </section>
                ))}
                {filteredSections.length === 0 ? <p>No help topics match your search.</p> : null}
            </div>
        </>
    );

    return isMobile ? (
        <AppSheet isOpen={isOpen} onClose={onClose} title={`${page} help`}>
            {content}
        </AppSheet>
    ) : (
        <AppDrawer isOpen={isOpen} onClose={onClose} title={`${page} help`}>
            {content}
        </AppDrawer>
    );
};
