/** @format */

import type { FC } from 'react';

import { KeyRound, LockKeyhole, LogOut, RotateCcw } from 'lucide-react';

import { shellSections } from '../constants/RuntimeDefaults';
import { formatTrialCountdownParts } from '../features/dashboard/SysAdminDashboardTrialSupport';
import type { AppRouteId, ThemeController } from '../types/AppTypes';
import { ActionButton } from './ActionButton';
import { appShellIcons } from './AppShellSupport';
import { DesktopWindowControls } from './DesktopWindowControls';
import { IconOnlyButton } from './IconOnlyButton';
import { ThemePalette } from './ThemePalette';

type AppShellTopbarProps = {
    readonly pageId: string;
    readonly isDemoMode: boolean;
    readonly trialStatus:
        | Awaited<ReturnType<NonNullable<typeof window.vaultBillDesktop>['getTrialStatus']>>
        | undefined;
    readonly themeController: ThemeController;
    readonly onChangePassword: () => void;
    readonly onResetDemo: () => void;
    readonly onLogout: () => void;
    readonly onOpenActivation: () => void;
    readonly onRefreshWindow?: (() => void) | undefined;
    readonly onMinimizeWindow?: (() => void) | undefined;
    readonly onCloseWindow?: (() => void) | undefined;
};

/** Renders the shell title area with theme, account, and trial actions. */
export const AppShellTopbar: FC<AppShellTopbarProps> = ({
    pageId,
    isDemoMode,
    trialStatus,
    themeController,
    onChangePassword,
    onResetDemo,
    onLogout,
    onOpenActivation,
    onRefreshWindow,
    onMinimizeWindow,
    onCloseWindow,
}) => {
    const routeId = pageId as AppRouteId;
    const section = shellSections.find((entry) => entry.id === routeId);
    const pageLabel = section?.label ?? pageId.toLocaleUpperCase();
    const pageTitle = isDemoMode ? 'VaultBill Demo' : pageLabel;
    const pageSubtitle = isDemoMode
        ? 'Guided browser demo workspace'
        : (section?.description ?? '');
    const SectionIcon = appShellIcons[routeId];

    return (
        <header className="app-shell-topbar">
            <div className="app-shell-topbar-copy">
                <span className="app-shell-topbar-mark" aria-hidden="true">
                    <SectionIcon size={24} />
                </span>
                <div className="app-shell-topbar-copy-text">
                    <p className="eyebrow app-shell-topbar-label">Workspace</p>
                    <strong>{pageTitle}</strong>
                    {pageSubtitle ? (
                        <small className="app-shell-topbar-subtitle">{pageSubtitle}</small>
                    ) : null}
                </div>
            </div>
            <div className="app-shell-topbar-actions">
                <div className="app-shell-topbar-status-group">
                    <div className="app-shell-mobile-account-actions">
                        <ThemePalette controller={themeController} />
                        {!isDemoMode ? (
                            <IconOnlyButton
                                aria-label="Change my password"
                                icon={<LockKeyhole aria-hidden="true" size={19} />}
                                onClick={onChangePassword}
                            />
                        ) : (
                            <IconOnlyButton
                                aria-label="Reset demo data"
                                icon={<RotateCcw aria-hidden="true" size={19} />}
                                onClick={onResetDemo}
                            />
                        )}
                        <IconOnlyButton
                            aria-label="Log out"
                            icon={<LogOut aria-hidden="true" size={19} />}
                            onClick={onLogout}
                        />
                    </div>
                    {!isDemoMode && trialStatus && !trialStatus.isFullVersion ? (
                        <ActionButton
                            className="app-shell-trial-pill"
                            onClick={onOpenActivation}
                            variant={trialStatus.isExpired ? 'danger' : 'default'}
                        >
                            <KeyRound aria-hidden="true" size={17} />
                            <span className="app-shell-trial-pill-copy">
                                <strong>
                                    {trialStatus.isExpired
                                        ? 'Trial expired'
                                        : formatTrialCountdownParts(trialStatus.remainingSeconds)
                                              .amount}
                                </strong>
                                <small>
                                    {trialStatus.isExpired
                                        ? 'Open activation'
                                        : formatTrialCountdownParts(trialStatus.remainingSeconds)
                                              .label}
                                </small>
                            </span>
                        </ActionButton>
                    ) : null}
                </div>
                {onRefreshWindow || onMinimizeWindow || onCloseWindow ? (
                    <div className="app-shell-topbar-controls-group">
                        <DesktopWindowControls
                            className="app-shell-window-controls"
                            isDesktop
                            onCloseWindow={onCloseWindow}
                            onMinimizeWindow={onMinimizeWindow}
                            onRefreshWindow={onRefreshWindow}
                        />
                    </div>
                ) : null}
            </div>
        </header>
    );
};
