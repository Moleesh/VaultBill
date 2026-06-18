/** @format */

import { ChevronLeft, ChevronRight, KeyRound, LogOut, RotateCcw, Server } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import type { FC } from 'react';

import { AppBrandIcon } from './AppBrandIcon/AppBrandIcon';
import { ThemePalette } from './ThemePalette';
import { appShellIcons } from './AppShellSupport';
import type { ThemeController } from '../types/AppTypes';
import type { ShellSection } from '../types/AppTypes';

type AppShellSidebarProps = {
    readonly applicationName: string;
    readonly landingRoute: string;
    readonly sections: readonly ShellSection[];
    readonly isExpanded: boolean;
    readonly isDemoMode: boolean;
    readonly isDesktop: boolean;
    readonly isLanBrowser: boolean;
    readonly operatorDisplayName: string;
    readonly operatorRole: string;
    readonly themeController: ThemeController;
    readonly onToggleExpanded: () => void;
    readonly onChangePassword: () => void;
    readonly onResetDemo: () => void;
    readonly onLogout: () => void;
};

export const AppShellSidebar: FC<AppShellSidebarProps> = ({
    applicationName,
    landingRoute,
    sections,
    isExpanded,
    isDemoMode,
    isDesktop,
    isLanBrowser,
    operatorDisplayName,
    operatorRole,
    themeController,
    onToggleExpanded,
    onChangePassword,
    onResetDemo,
    onLogout,
}) => (
    <aside className="app-shell-sidebar">
        <NavLink className="app-shell-brand" to={landingRoute}>
            <AppBrandIcon size="small" />
            <strong className="app-shell-nav-label">{applicationName}</strong>
        </NavLink>
        <button
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            className="app-shell-sidebar-toggle icon-button"
            onClick={onToggleExpanded}
            type="button"
        >
            {isExpanded ? <ChevronLeft aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
        </button>
        <nav aria-label="Primary" className="app-shell-nav">
            {sections.map((section) => {
                const Icon = appShellIcons[section.id as keyof typeof appShellIcons];
                return (
                    <NavLink
                        aria-label={section.label}
                        className={({ isActive }) =>
                            `app-shell-nav-item${isActive ? ' is-active' : ''}`
                        }
                        key={section.id}
                        title={isExpanded ? undefined : section.label}
                        to={`/app/${section.id}`}
                    >
                        <Icon aria-hidden="true" className="app-shell-nav-icon" size={21} />
                        <span className="app-shell-nav-label">{section.label}</span>
                    </NavLink>
                );
            })}
        </nav>
        <div className="app-shell-operator">
            <div className="app-shell-operator-copy app-shell-nav-label">
                <strong>{operatorDisplayName}</strong>
                <small>{isDemoMode ? 'Demo mode' : operatorRole}</small>
                {!isDemoMode && (isDesktop || isLanBrowser) ? (
                    <small className="app-shell-host-status">
                        <Server aria-hidden="true" size={13} />
                        {isDesktop ? 'Hosted web active' : 'Connected to desktop host'}
                    </small>
                ) : null}
            </div>
            <div className="app-shell-operator-actions">
                <ThemePalette controller={themeController} />
                {!isDemoMode ? (
                    <button
                        className="icon-button"
                        aria-label="Change my password"
                        onClick={onChangePassword}
                        type="button"
                    >
                        <KeyRound aria-hidden="true" size={20} />
                    </button>
                ) : null}
                {isDemoMode ? (
                    <button
                        className="icon-button"
                        aria-label="Reset demo data"
                        onClick={onResetDemo}
                        type="button"
                    >
                        <RotateCcw aria-hidden="true" size={20} />
                    </button>
                ) : null}
                <button
                    className="icon-button"
                    aria-label="Log out"
                    onClick={onLogout}
                    type="button"
                >
                    <LogOut aria-hidden="true" size={20} />
                </button>
            </div>
        </div>
    </aside>
);
