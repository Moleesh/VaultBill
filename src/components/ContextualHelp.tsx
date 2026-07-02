/** @format */

/** Shared helper card and text patterns for inline guidance across the app. */

import type { FC } from 'react';
import { useEffect, useState } from 'react';

import { useForm } from '@tanstack/react-form';

import { useCapabilities } from '../capability/CapabilityContext';
import { getHelpSections } from '../help/HelpContent';
import type { Role } from '../types/AppTypes';
import { AppDrawer } from './AppDrawer/AppDrawer';
import { AppSheet } from './AppSheet/AppSheet';
import { FormField } from './FormFields';

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
    const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches);
    const form = useForm({
        defaultValues: {
            query: '',
        },
    });
    const sections = getHelpSections(page, role, capabilities);
    const normalizedQuery = form.state.values.query.trim().toLocaleLowerCase();
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
            <form.Field name="query">
                {(field) => (
                    <FormField.TextField
                        label="Search help"
                        onChange={(event) => {
                            field.handleChange(event.currentTarget.value);
                        }}
                        placeholder="Search actions and topics"
                        value={field.state.value}
                        wrapperClassName="help-search"
                    />
                )}
            </form.Field>
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
