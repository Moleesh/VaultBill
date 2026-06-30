/** @format */

import { lazy } from 'react';
import type { ComponentType, FC } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from './features/auth/ProtectedRoute';

const lazyRouteReloadSessionKey = 'vaultbill.lazy-route-reload';

const isRecoverableLazyRouteError = (error: unknown): boolean => {
    if (!(error instanceof Error)) return false;
    return (
        error.message.includes('Failed to fetch dynamically imported module') ||
        error.message.includes('Importing a module script failed') ||
        error.message.includes('Failed to load module script')
    );
};

type LazyRouteModule<TProps extends object> = {
    readonly default: ComponentType<TProps>;
};

const lazyRoute = <TProps extends object>(importer: () => Promise<LazyRouteModule<TProps>>) =>
    lazy(async () => {
        try {
            const loaded = await importer();
            window.sessionStorage.removeItem(lazyRouteReloadSessionKey);
            return loaded;
        } catch (error) {
            if (
                isRecoverableLazyRouteError(error) &&
                window.sessionStorage.getItem(lazyRouteReloadSessionKey) !== 'pending'
            ) {
                window.sessionStorage.setItem(lazyRouteReloadSessionKey, 'pending');
                window.location.reload();
            }
            throw error;
        }
    });

export const AppShell = lazyRoute(async () =>
    import('./components/AppShell').then((module) => ({ default: module.AppShell })),
);
export const AccessDeniedPage = lazyRoute(async () =>
    import('./features/auth/AccessDeniedPage').then((module) => ({
        default: module.AccessDeniedPage,
    })),
);
export const LoginPage = lazyRoute(async () =>
    import('./features/auth/LoginPage').then((module) => ({ default: module.LoginPage })),
);
export const BuilderPage = lazyRoute(async () =>
    import('./features/builder/BuilderPage').then((module) => ({ default: module.BuilderPage })),
);
export const DashboardPage = lazyRoute(async () =>
    import('./features/dashboard/DashboardPage').then((module) => ({
        default: module.DashboardPage,
    })),
);
export const RecordsPage = lazyRoute(async () =>
    import('./features/records/RecordsPage').then((module) => ({ default: module.RecordsPage })),
);
export const ReportsPage = lazyRoute(async () =>
    import('./features/reports/ReportsPage').then((module) => ({ default: module.ReportsPage })),
);
export const SettingsPage = lazyRoute(async () =>
    import('./features/settings/SettingsPage').then((module) => ({
        default: module.SettingsPage,
    })),
);
export const SetupPage = lazyRoute(async () =>
    import('./features/setup/SetupPage').then((module) => ({ default: module.SetupPage })),
);

/** Lightweight fallback shown while route-level chunks are loading. */
export const AppRouteFallback: FC = () => <div className="app-screen-state" aria-busy="true" />;

type AppRouteTreeProps = {
    readonly isStaticHostedBrowserBuild: boolean;
    readonly shouldAllowSetupWizard: boolean;
    readonly setupRequired: boolean;
    readonly setupWizardRevision: number;
    readonly onOpenSetupWizard: () => void;
    readonly onSetupComplete: () => void;
};

/** Renders the complete application route tree with lazy-loaded route screens. */
export const AppRouteTree: FC<AppRouteTreeProps> = ({
    isStaticHostedBrowserBuild,
    onOpenSetupWizard,
    setupRequired,
    setupWizardRevision,
    shouldAllowSetupWizard,
    onSetupComplete,
}) => (
    <Routes>
        <Route
            path="/setup"
            element={
                isStaticHostedBrowserBuild || !shouldAllowSetupWizard ? (
                    <Navigate replace to="/login" />
                ) : (
                    <SetupPage key={setupWizardRevision} onComplete={onSetupComplete} />
                )
            }
        />
        <Route
            path="/login"
            element={
                setupRequired ? (
                    <Navigate replace to="/setup" />
                ) : (
                    <LoginPage onOpenSetupWizard={onOpenSetupWizard} />
                )
            }
        />
        <Route
            path="/access-denied"
            element={
                <ProtectedRoute>
                    <AccessDeniedPage />
                </ProtectedRoute>
            }
        />
        <Route
            path="/app"
            element={
                setupRequired ? (
                    <Navigate replace to="/setup" />
                ) : (
                    <ProtectedRoute>
                        <AppShell />
                    </ProtectedRoute>
                )
            }
        >
            <Route index element={<Navigate replace to="dashboard" />} />
            <Route
                path="dashboard"
                element={
                    <ProtectedRoute roles={['Admin', 'SysAdmin']}>
                        <DashboardPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="records"
                element={
                    <ProtectedRoute roles={['Admin', 'User']}>
                        <RecordsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="records/new"
                element={
                    <ProtectedRoute roles={['Admin', 'User']}>
                        <RecordsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="records/:recordId"
                element={
                    <ProtectedRoute roles={['Admin', 'User']}>
                        <RecordsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="reports"
                element={
                    <ProtectedRoute roles={['Admin', 'User']}>
                        <ReportsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="builder"
                element={
                    <ProtectedRoute roles={['SysAdmin']}>
                        <BuilderPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="settings"
                element={
                    <ProtectedRoute roles={['Admin', 'SysAdmin']}>
                        <SettingsPage />
                    </ProtectedRoute>
                }
            />
        </Route>
        <Route path="/" element={<Navigate replace to={setupRequired ? '/setup' : '/login'} />} />
        <Route path="*" element={<Navigate replace to={setupRequired ? '/setup' : '/login'} />} />
    </Routes>
);
