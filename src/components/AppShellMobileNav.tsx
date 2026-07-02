/** @format */

import type { FC } from 'react';
import { NavLink } from 'react-router-dom';

import type { ShellSection } from '../types/AppTypes';
import { appShellIcons } from './AppShellSupport';

type AppShellMobileNavProps = {
    readonly sections: readonly ShellSection[];
};

export const AppShellMobileNav: FC<AppShellMobileNavProps> = ({ sections }) => (
    <nav aria-label="Mobile primary" className="app-shell-mobile-nav">
        {sections.map((section) => {
            const Icon = appShellIcons[section.id as keyof typeof appShellIcons];
            return (
                <NavLink aria-label={section.label} key={section.id} to={`/app/${section.id}`}>
                    <Icon aria-hidden="true" size={20} />
                    <span>{section.label}</span>
                </NavLink>
            );
        })}
    </nav>
);
