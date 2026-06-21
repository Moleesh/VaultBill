/** @format */

import {
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    KeyRound,
    LogOut,
    RotateCcw,
    Server,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import type { FC } from 'react';

import { AppBrandIcon } from './AppBrandIcon/AppBrandIcon';
import { IconOnlyButton } from './IconOnlyButton';
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
    readonly isHostedWeb: boolean;
    readonly operatorDisplayName: string;
    readonly operatorRole: string;
    readonly hostedWebUrl?: string;
    readonly themeController: ThemeController;
    readonly onToggleExpanded: () => void;
    readonly onChangePassword: () => void;
    readonly onResetDemo: () => void;
    readonly onOpenHostedWeb: () => void;
    readonly onLogout: () => void;
};

export const AppShellSidebar: FC<AppShellSidebarProps> = ({
    applicationName,
    landingRoute,
    sections,
    isExpanded,
    isDemoMode,
    isDesktop,
    isHostedWeb,
    operatorDisplayName,
    operatorRole,
    hostedWebUrl,
    themeController,
    onToggleExpanded,
    onChangePassword,
    onResetDemo,
    onOpenHostedWeb,
    onLogout,
}) => (
    <aside className="app-shell-sidebar">
        <NavLink className="app-shell-brand" to={landingRoute}>
            <AppBrandIcon size="small" />
            <strong className="app-shell-nav-label">{applicationName}</strong>
        </NavLink>
        <IconOnlyButton
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            className="app-shell-sidebar-toggle icon-button"
            icon={
                isExpanded ? (
                    <ChevronLeft aria-hidden="true" />
                ) : (
                    <ChevronRight aria-hidden="true" />
                )
            }
            onClick={onToggleExpanded}
        />
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
                {!isDemoMode && (isDesktop || isHostedWeb) ? (
                    <small className="app-shell-host-status">
                        {isDesktop ? <Server aria-hidden="true" size={13} /> : null}
                        {isDesktop ? 'Hosted web active' : 'Connected to desktop host'}
                    </small>
                ) : null}
                {hostedWebUrl ? (
                    <small className="app-shell-host-status app-shell-host-url">
                        {hostedWebUrl.replace(/^https?:\/\//u, '')}
                    </small>
                ) : null}
            </div>
            <div className="app-shell-operator-actions">
                <ThemePalette controller={themeController} />
                {hostedWebUrl ? (
                    <IconOnlyButton
                        aria-label="Open hosted web"
                        icon={<ExternalLink aria-hidden="true" size={20} />}
                        onClick={onOpenHostedWeb}
                        title={hostedWebUrl}
                    />
                ) : null}
                {!isDemoMode ? (
                    <IconOnlyButton
                        aria-label="Change my password"
                        icon={<KeyRound aria-hidden="true" size={20} />}
                        onClick={onChangePassword}
                    />
                ) : null}
                {isDemoMode ? (
                    <IconOnlyButton
                        aria-label="Reset demo data"
                        icon={<RotateCcw aria-hidden="true" size={20} />}
                        onClick={onResetDemo}
                    />
                ) : null}
                <IconOnlyButton
                    aria-label="Log out"
                    icon={<LogOut aria-hidden="true" size={20} />}
                    onClick={onLogout}
                />
            </div>
        </div>
    </aside>
);
