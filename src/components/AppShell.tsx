/** @format */

import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';

import { useCapabilities } from '../capability/CapabilityContext';
import { shouldRenderDesktopChrome } from '../capability/CapabilityRegistry';
import { defaultRuntimeBranding, shellSections } from '../constants/RuntimeDefaults';
import { useSession } from '../features/auth/SessionContext';
import { useRecordStore } from '../features/records/RecordStoreContext';
import { getRuntimeQueryScope, queryKeys } from '../query/QueryKeys';
import { fetchHostedWebUrl, fetchTrialStatus } from '../query/RuntimeQueries';
import type { AppRouteId } from '../types/AppTypes';
import { createAppShellActions } from './AppShellActions';
import { AppShellContentFrame } from './AppShellContentFrame';
import { AppShellManagedDialogs } from './AppShellManagedDialogs';
import { AppShellMobileNav } from './AppShellMobileNav';
import { AppShellSidebar } from './AppShellSidebar';
import type { DesktopTrialStatus } from './AppShellSupport';
import { getAllowedSectionIds, getPageId, rememberDesktopLastAppTab } from './AppShellSupport';
import { AppShellTopbar } from './AppShellTopbar';

import { usePersistentWorkspaceTheme } from '../hooks/usePersistentWorkspaceTheme';

import '../styles/Components/AppShell.scss';

export const AppShell: FC = () => {
    const capabilities = useCapabilities();
    const { logout, operatorContext, resetPassword } = useSession();
    const { resetDemoData } = useRecordStore();
    const location = useLocation();
    const navigate = useNavigate();
    const themeController = usePersistentWorkspaceTheme({
        capabilities,
        operatorContext,
    });
    const contentRef = useRef<HTMLElement>(null);
    const runtimeScope = getRuntimeQueryScope(capabilities);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isResetOpen, setIsResetOpen] = useState(false);
    const [isActivationOpen, setIsActivationOpen] = useState(false);
    const [activationMessage, setActivationMessage] = useState('');
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const [accountPasswordMessage, setAccountPasswordMessage] = useState('');
    const [hostedWebUrl, setHostedWebUrl] = useState('');
    const [trialStatus, setTrialStatus] = useState<DesktopTrialStatus>();
    const [scrollProgress, setScrollProgress] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const showWindowControls = shouldRenderDesktopChrome(capabilities);
    const trialStatusQuery = useQuery({
        queryKey: queryKeys.trialStatus(runtimeScope, operatorContext?.account.userId ?? 'guest'),
        enabled:
            Boolean(operatorContext) &&
            (Boolean(window.vaultBillDesktop) || capabilities.isHostedWeb),
        queryFn: () => fetchTrialStatus({ capabilities }),
        staleTime: Number.POSITIVE_INFINITY,
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
        if (!capabilities.isDesktop || !operatorContext) return;
        rememberDesktopLastAppTab(location.pathname);
    }, [capabilities.isDesktop, location.pathname, operatorContext]);

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
    const builderLibraryMode = pageId === 'builder';
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
                    {...(showWindowControls
                        ? {
                              onCloseWindow: shellActions.closeWindow,
                              onMinimizeWindow: shellActions.minimizeWindow,
                              onRefreshWindow: shellActions.refreshWindow,
                          }
                        : {})}
                    {...(builderLibraryMode
                        ? {
                              pageLabelOverride: 'Document library',
                              pageSubtitleOverride: 'Manage document formats and print templates.',
                          }
                        : {})}
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
