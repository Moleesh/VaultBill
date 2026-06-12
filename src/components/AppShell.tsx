/** @format */

/**
 * Desktop shell coordinator that keeps the route frame, scroll rail, and
 * authenticated chrome in sync while the workspace content changes.
 */

import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { FC } from 'react';

import { useCapabilities } from '../capability/CapabilityContext';
import { defaultRuntimeBranding, shellSections } from '../constants/PhaseOneSeed';
import { useSession } from '../features/auth/SessionContext';
import { useRecordStore } from '../features/records/RecordStoreContext';
import { useThemeController } from '../hooks/useThemeController';
import { requestHostedApi } from '../runtime/HostedApi';
import { createAppShellActions } from './AppShellActions';
import { getAllowedSectionIds, getPageId } from './AppShellSupport';
import { AppShellDialogs } from './AppShellDialogs';
import { AppShellMobileNav } from './AppShellMobileNav';
import { AppShellSidebar } from './AppShellSidebar';
import { AppShellTopbar } from './AppShellTopbar';
import type { AppRouteId } from '../types/AppTypes';
import '../styles/Components/AppShell.scss';

/** Renders the authenticated desktop application frame and its modal actions. */
export const AppShell: FC = () => {
    const capabilities = useCapabilities();
    const { logout, operatorContext, resetPassword } = useSession();
    const { resetDemoData } = useRecordStore();
    const location = useLocation();
    const navigate = useNavigate();
    const themeController = useThemeController('teal-flow');
    const contentRef = useRef<HTMLElement>(null);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isResetOpen, setIsResetOpen] = useState(false);
    const [isActivationOpen, setIsActivationOpen] = useState(false);
    const [licenseKey, setLicenseKey] = useState('');
    const [activationMessage, setActivationMessage] = useState('');
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const [accountPassword, setAccountPassword] = useState('');
    const [accountPasswordConfirmation, setAccountPasswordConfirmation] = useState('');
    const [accountPasswordMessage, setAccountPasswordMessage] = useState('');
    const [trialStatus, setTrialStatus] =
        useState<
            Awaited<ReturnType<NonNullable<typeof window.vaultBillDesktop>['getTrialStatus']>>
        >();
    const [scrollProgress, setScrollProgress] = useState(0);
    const [isExpanded, setIsExpanded] = useState(
        () => window.localStorage.getItem('vaultbill.sidebar.expanded') === 'true',
    );
    const shellActions = createAppShellActions({
        accountPassword,
        accountUserId: operatorContext?.account.userId ?? '',
        licenseKey,
        logout,
        navigate,
        resetDemoData,
        resetPassword,
        setAccountPassword,
        setAccountPasswordConfirmation,
        setAccountPasswordMessage,
        setActivationMessage,
        setIsActivationOpen,
        setIsPasswordOpen,
        setIsResetOpen,
        setLicenseKey,
        accountPasswordConfirmation,
        setTrialStatus,
    });

    useEffect(() => {
        if (typeof contentRef.current?.scrollTo === 'function') {
            contentRef.current.scrollTo({ top: 0 });
        }
        setScrollProgress(0);
    }, [location.pathname]);

    useEffect(() => {
        if (window.vaultBillDesktop) {
            void window.vaultBillDesktop.getTrialStatus().then(setTrialStatus);
        } else if (capabilities.isLanBrowser) {
            void requestHostedApi<NonNullable<typeof trialStatus>>('/trial/status').then(
                setTrialStatus,
            );
        }
    }, [capabilities.isLanBrowser]);

    if (!operatorContext) return null;

    const allowedSectionIds = getAllowedSectionIds(capabilities.isDemoMode, operatorContext.role);
    const sections = shellSections.filter((section) =>
        allowedSectionIds.has(section.id as AppRouteId),
    );
    const pageId = getPageId(location.pathname);
    const landingRoute = operatorContext.role === 'User' ? '/app/records' : '/app/dashboard';

    return (
        <div className={`app-shell${isExpanded ? ' is-sidebar-expanded' : ''}`}>
            <a className="skip-link" href="#main-content">
                Skip to main content
            </a>
            <AppShellSidebar
                applicationName={defaultRuntimeBranding.applicationName}
                isDemoMode={capabilities.isDemoMode}
                isDesktop={capabilities.isDesktop}
                isExpanded={isExpanded}
                isLanBrowser={capabilities.isLanBrowser}
                landingRoute={landingRoute}
                onChangePassword={shellActions.openPasswordDialog}
                onLogout={shellActions.logOut}
                onResetDemo={shellActions.openResetDialog}
                onToggleExpanded={() => {
                    setIsExpanded((current) => {
                        const next = !current;
                        window.localStorage.setItem('vaultbill.sidebar.expanded', String(next));
                        return next;
                    });
                }}
                operatorDisplayName={operatorContext.account.displayName}
                operatorRole={operatorContext.role}
                sections={sections}
                themeController={themeController}
            />
            <div className="app-shell__body">
                <AppShellTopbar
                    isDemoMode={capabilities.isDemoMode}
                    onChangePassword={shellActions.openPasswordDialog}
                    onLogout={shellActions.logOut}
                    onOpenActivation={shellActions.openActivationDialog}
                    onResetDemo={shellActions.openResetDialog}
                    pageId={pageId}
                    themeController={themeController}
                    trialStatus={trialStatus}
                />
                <main
                    className="app-shell__content"
                    id="main-content"
                    onScroll={(event) => {
                        const target = event.currentTarget;
                        const maximum = target.scrollHeight - target.clientHeight;
                        setScrollProgress(maximum > 0 ? (target.scrollTop / maximum) * 100 : 0);
                    }}
                    ref={contentRef}
                >
                    <Outlet />
                </main>
                <div className="app-shell__scroll-rail" aria-hidden="true">
                    <span style={{ height: `${String(scrollProgress)}%` }} />
                </div>
                <AppShellMobileNav sections={sections} />
            </div>
            <AppShellDialogs
                accountPassword={accountPassword}
                accountPasswordConfirmation={accountPasswordConfirmation}
                accountPasswordMessage={accountPasswordMessage}
                activationMessage={activationMessage}
                isActivationOpen={isActivationOpen}
                isHelpOpen={isHelpOpen}
                isPasswordOpen={isPasswordOpen}
                isResetOpen={isResetOpen}
                licenseKey={licenseKey}
                onAccountPasswordChange={(value) => {
                    setAccountPassword(value);
                    setAccountPasswordMessage('');
                }}
                onAccountPasswordConfirmationChange={(value) => {
                    setAccountPasswordConfirmation(value);
                    setAccountPasswordMessage('');
                }}
                onCloseActivation={() => {
                    setIsActivationOpen(false);
                }}
                onCloseHelp={() => {
                    setIsHelpOpen(false);
                }}
                onClosePassword={() => {
                    setIsPasswordOpen(false);
                }}
                onCloseReset={() => {
                    setIsResetOpen(false);
                }}
                onConfirmReset={() => {
                    shellActions.resetDemo();
                }}
                onLicenseKeyChange={setLicenseKey}
                onOpenHelp={() => {
                    setIsHelpOpen(true);
                }}
                onSubmitActivation={shellActions.submitActivation}
                onSubmitPassword={shellActions.submitPassword}
                pageId={pageId}
                role={operatorContext.role}
            />
        </div>
    );
};
