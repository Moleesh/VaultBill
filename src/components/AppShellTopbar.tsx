/** @format */

import { KeyRound, LogOut, Minimize2, RotateCcw, X } from 'lucide-react';
import type { FC } from 'react';

import { ThemePalette } from './ThemePalette';
import type { ThemeController } from '../types/AppTypes';

type AppShellTopbarProps = {
    readonly pageId: string;
    readonly isDemoMode: boolean;
    readonly isDesktop: boolean;
    readonly trialStatus:
        | Awaited<ReturnType<NonNullable<typeof window.vaultBillDesktop>['getTrialStatus']>>
        | undefined;
    readonly themeController: ThemeController;
    readonly onChangePassword: () => void;
    readonly onResetDemo: () => void;
    readonly onLogout: () => void;
    readonly onMinimize: () => void;
    readonly onClose: () => void;
    readonly onOpenActivation: () => void;
};

export const AppShellTopbar: FC<AppShellTopbarProps> = ({
    pageId,
    isDemoMode,
    isDesktop,
    trialStatus,
    themeController,
    onChangePassword,
    onResetDemo,
    onLogout,
    onMinimize,
    onClose,
    onOpenActivation,
}) => (
    <header className="app-shell__topbar">
        <div>
            <p className="eyebrow">{pageId}</p>
            <strong>{isDemoMode ? 'VaultBill Demo' : 'Business workspace'}</strong>
        </div>
        <div className="app-shell__topbar-actions">
            <div className="app-shell__mobile-account-actions">
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
            {isDesktop ? (
                <div className="app-shell__window-controls">
                    <button
                        className="icon-button"
                        aria-label="Minimize window"
                        onClick={onMinimize}
                        type="button"
                    >
                        <Minimize2 aria-hidden="true" size={18} />
                    </button>
                    <button
                        className="icon-button"
                        aria-label="Close window"
                        onClick={onClose}
                        type="button"
                    >
                        <X aria-hidden="true" size={18} />
                    </button>
                </div>
            ) : null}
            {!isDemoMode && trialStatus && !trialStatus.isFullVersion ? (
                <button
                    className={trialStatus.isExpired ? 'button-danger' : ''}
                    onClick={onOpenActivation}
                    type="button"
                >
                    <KeyRound aria-hidden="true" size={17} />
                    {trialStatus.isExpired
                        ? 'Trial expired'
                        : `${String(Math.ceil(trialStatus.remainingSeconds / 3600))}h trial`}
                </button>
            ) : null}
        </div>
    </header>
);
