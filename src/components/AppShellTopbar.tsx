/** @format */

import { KeyRound, LogOut, RotateCcw } from 'lucide-react';
import type { FC } from 'react';

import { ThemePalette } from './ThemePalette';
import { appShellIcons } from './AppShellSupport';
import { shellSections } from '../constants/PhaseOneSeed';
import { formatTrialCountdownParts } from '../features/dashboard/SysAdminDashboardTrialSupport';
import type { AppRouteId, ThemeController } from '../types/AppTypes';

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
};

export const AppShellTopbar: FC<AppShellTopbarProps> = ({
    pageId,
    isDemoMode,
    trialStatus,
    themeController,
    onChangePassword,
    onResetDemo,
    onLogout,
    onOpenActivation,
}) => {
    const routeId = pageId as AppRouteId;
    const section = shellSections.find((entry) => entry.id === routeId);
    const pageLabel = section?.label ?? pageId.toLocaleUpperCase();
    const pageTitle = isDemoMode ? 'VaultBill Demo' : pageLabel;
    const pageSubtitle = isDemoMode ? 'Browser demo workspace' : (section?.description ?? '');
    const PageIcon = appShellIcons[routeId];

    return (
        <header className="app-shell-topbar">
            <div className="app-shell-topbar-copy">
                <span className="app-shell-topbar-mark" aria-hidden="true">
                    <PageIcon size={18} />
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
                <div className="app-shell-mobile-account-actions">
                    <ThemePalette controller={themeController} />
                    {!isDemoMode ? (
                        <button
                            className="icon-button"
                            aria-label="Change my password"
                            onClick={onChangePassword}
                            type="button"
                        >
                            <KeyRound aria-hidden="true" size={19} />
                        </button>
                    ) : (
                        <button
                            className="icon-button"
                            aria-label="Reset demo data"
                            onClick={onResetDemo}
                            type="button"
                        >
                            <RotateCcw aria-hidden="true" size={19} />
                        </button>
                    )}
                    <button
                        className="icon-button"
                        aria-label="Log out"
                        onClick={onLogout}
                        type="button"
                    >
                        <LogOut aria-hidden="true" size={19} />
                    </button>
                </div>
                {!isDemoMode && trialStatus && !trialStatus.isFullVersion ? (
                    <button
                        className={`app-shell-trial-pill${trialStatus.isExpired ? ' button-danger' : ''}`}
                        onClick={onOpenActivation}
                        type="button"
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
                                    : formatTrialCountdownParts(trialStatus.remainingSeconds).label}
                            </small>
                        </span>
                    </button>
                ) : null}
            </div>
        </header>
    );
};
