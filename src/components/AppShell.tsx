/** @format */

/**
 * Desktop shell coordinator that keeps the route frame, scroll rail, and
 * authenticated chrome in sync while the workspace content changes.
 */

import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { FC } from 'react';
import { useQuery } from '@tanstack/react-query';

import { shouldRenderDesktopChrome } from '../capability/CapabilityRegistry';
import { useCapabilities } from '../capability/CapabilityContext';
import { defaultRuntimeBranding, shellSections } from '../constants/RuntimeDefaults';
import { useSession } from '../features/auth/SessionContext';
import { useRecordStore } from '../features/records/RecordStoreContext';
import { useThemeController } from '../hooks/useThemeController';
import { loadResolvedTheme } from '../runtime/WorkspaceTheme';
import { getRuntimeQueryScope, queryKeys } from '../query/QueryKeys';
import { fetchHostedWebUrl, fetchTrialStatus } from '../query/RuntimeQueries';
import { createAppShellActions } from './AppShellActions';
import { getAllowedSectionIds, getPageId } from './AppShellSupport';
import { AppShellContentFrame } from './AppShellContentFrame';
import { AppShellManagedDialogs } from './AppShellManagedDialogs';
import { AppShellMobileNav } from './AppShellMobileNav';
import { AppShellSidebar } from './AppShellSidebar';
import { AppShellTopbar } from './AppShellTopbar';
import { AppShellWindowChrome } from './AppShellWindowChrome';
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
    const { setThemeId } = themeController;
    const contentRef = useRef<HTMLElement>(null);
    const runtimeScope = getRuntimeQueryScope(capabilities);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isResetOpen, setIsResetOpen] = useState(false);
    const [isActivationOpen, setIsActivationOpen] = useState(false);
    const [activationMessage, setActivationMessage] = useState('');
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const [accountPasswordMessage, setAccountPasswordMessage] = useState('');
    const [hostedWebUrl, setHostedWebUrl] = useState('');
    const [trialStatus, setTrialStatus] =
        useState<
            Awaited<ReturnType<NonNullable<typeof window.vaultBillDesktop>['getTrialStatus']>>
        >();
    const [scrollProgress, setScrollProgress] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const showWindowControls = shouldRenderDesktopChrome(capabilities);
    const trialStatusQuery = useQuery({
        queryKey: queryKeys.trialStatus(runtimeScope, operatorContext?.account.userId ?? 'guest'),
        enabled:
            Boolean(operatorContext) &&
            (Boolean(window.vaultBillDesktop) || capabilities.isHostedWeb),
        queryFn: () => fetchTrialStatus({ capabilities }),
    });
    const hostedWebUrlQuery = useQuery({
        queryKey: queryKeys.hostedWebUrl(runtimeScope),
        enabled: Boolean(window.vaultBillDesktop) || capabilities.isHostedWeb,
        queryFn: () => fetchHostedWebUrl({ capabilities }),
        staleTime: Number.POSITIVE_INFINITY,
    });
    const shellActions = createAppShellActions({
        accountUserId: operatorContext?.account.userId ?? '',
        logout,
        navigate,
        resetDemoData,
        resetPassword,
        setAccountPasswordMessage,
        setActivationMessage,
        setIsActivationOpen,
        setIsPasswordOpen,
        setIsResetOpen,
        setTrialStatus,
    });

    useEffect(() => {
        if (typeof contentRef.current?.scrollTo === 'function') {
            contentRef.current.scrollTo({ left: 0, top: 0 });
        }
        setScrollProgress(0);
    }, [location.pathname]);

    useEffect(() => {
        void loadResolvedTheme(capabilities.isHostedWeb)
            .then((resolvedTheme) => {
                setThemeId(resolvedTheme);
            })
            .catch(() => undefined);
    }, [capabilities.isHostedWeb, setThemeId]);

    useEffect(() => {
        if (!operatorContext) {
            setTrialStatus(undefined);
            return;
        }
        if (trialStatusQuery.data) {
            setTrialStatus(trialStatusQuery.data);
        }
    }, [operatorContext, trialStatusQuery.data]);

    useEffect(() => {
        setHostedWebUrl(hostedWebUrlQuery.data ?? '');
    }, [hostedWebUrlQuery.data]);

    if (!operatorContext) return null;

    const allowedSectionIds = getAllowedSectionIds(capabilities.isDemoMode, operatorContext.role);
    const sections = shellSections.filter((section) =>
        allowedSectionIds.has(section.id as AppRouteId),
    );
    const pageId = getPageId(location.pathname);
    const landingRoute = operatorContext.role === 'User' ? '/app/records' : '/app/dashboard';

    return (
        <div
            className={`app-shell${isExpanded ? ' is-sidebar-expanded' : ''}${
                showWindowControls ? ' has-window-controls' : ''
            }`}
        >
            <a className="skip-link" href="#main-content">
                Skip to main content
            </a>
            {showWindowControls ? (
                <AppShellWindowChrome
                    onCloseWindow={shellActions.closeWindow}
                    onMinimizeWindow={shellActions.minimizeWindow}
                    onRefreshWindow={shellActions.refreshWindow}
                />
            ) : null}
            <AppShellSidebar
                applicationName={defaultRuntimeBranding.applicationName}
                isDemoMode={capabilities.isDemoMode}
                isDesktop={showWindowControls}
                isExpanded={isExpanded}
                isHostedWeb={capabilities.isHostedWeb}
                canOpenHostedWeb={capabilities.isDesktop}
                landingRoute={landingRoute}
                hostedWebUrl={hostedWebUrl}
                onChangePassword={shellActions.openPasswordDialog}
                onLogout={shellActions.logOut}
                onOpenHostedWeb={() => {
                    if (window.vaultBillDesktop) {
                        void window.vaultBillDesktop.openHostedWeb();
                        return;
                    }
                    if (hostedWebUrl) window.open(hostedWebUrl, '_blank', 'noopener,noreferrer');
                }}
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
            <div className="app-shell-body">
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
                <AppShellContentFrame
                    contentRef={contentRef}
                    onScroll={(event) => {
                        const target = event.currentTarget;
                        const maximum = target.scrollHeight - target.clientHeight;
                        setScrollProgress(maximum > 0 ? (target.scrollTop / maximum) * 100 : 0);
                    }}
                    scrollProgress={scrollProgress}
                >
                    <Outlet />
                </AppShellContentFrame>
                <AppShellMobileNav sections={sections} />
            </div>
            <AppShellManagedDialogs
                accountPasswordMessage={accountPasswordMessage}
                activationMessage={activationMessage}
                isActivationOpen={isActivationOpen}
                isHelpOpen={isHelpOpen}
                isPasswordOpen={isPasswordOpen}
                isResetOpen={isResetOpen}
                onConfirmReset={shellActions.resetDemo}
                onSubmitActivation={shellActions.submitActivation}
                onSubmitPassword={shellActions.submitPassword}
                pageId={pageId}
                role={operatorContext.role}
                setAccountPasswordMessage={setAccountPasswordMessage}
                setIsActivationOpen={setIsActivationOpen}
                setIsHelpOpen={setIsHelpOpen}
                setIsPasswordOpen={setIsPasswordOpen}
                setIsResetOpen={setIsResetOpen}
            />
        </div>
    );
};
