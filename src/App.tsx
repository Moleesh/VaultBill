/** @format */

/** Root application entry that wires the router, shell, and mode-specific page stack. */

import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { FC } from 'react';

import { CapabilityProvider } from './capability/CapabilityContext';
import { useCapabilities } from './capability/CapabilityContext';
import { AppShell } from './components/AppShell';
import { AccessDeniedPage } from './features/auth/AccessDeniedPage';
import { LoginPage } from './features/auth/LoginPage';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { SessionProvider } from './features/auth/SessionContext';
import { BuilderPage } from './features/builder/BuilderPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { RecordsPage } from './features/records/RecordsPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { RecordStoreProvider } from './features/records/RecordStoreContext';
import { SetupPage } from './features/setup/SetupPage';
import { requestHostedApi } from './runtime/HostedApi';

const AppRoutes: FC = () => {
    const capabilities = useCapabilities();
    const [setupRevision, setSetupRevision] = useState(0);
    const [desktopSetupRequired, setDesktopSetupRequired] = useState<boolean | null>(
        !capabilities.isDemoMode && (window.vaultBillDesktop || capabilities.isLanBrowser)
            ? null
            : false,
    );
    const setupRequired = desktopSetupRequired ?? false;

    useEffect(() => {
        if (capabilities.isDemoMode) {
            setDesktopSetupRequired(false);
            return;
        }

        let isCurrent = true;
        const desktopRequest = window.vaultBillDesktop
            ? Promise.all([
                  window.vaultBillDesktop.listAccounts(),
                  window.vaultBillDesktop.getBusinessSettings(),
              ]).then(([accounts, business]) => ({
                  hasActiveAdmin: accounts.some(
                      (account) => account.role === 'Admin' && account.isActive,
                  ),
                  business,
              }))
            : capabilities.isLanBrowser
              ? requestHostedApi<{
                    readonly isSetupComplete: boolean;
                    readonly hasActiveAdmin: boolean;
                    readonly business: {
                        readonly companyName: string;
                        readonly address: string;
                    };
                }>('/setup/status').then((status) => ({
                    hasActiveAdmin: status.hasActiveAdmin,
                    business: status.business,
                }))
              : Promise.resolve({
                    hasActiveAdmin: false,
                    business: { companyName: '', address: '' },
                });

        void desktopRequest
            .then(({ hasActiveAdmin, business }) => {
                if (!isCurrent) return;
                const isConfiguredBusiness =
                    typeof business === 'object' &&
                    business !== null &&
                    typeof (business as { readonly companyName?: unknown }).companyName ===
                        'string' &&
                    (business as { readonly companyName: string }).companyName.trim().length > 0 &&
                    typeof (business as { readonly address?: unknown }).address === 'string' &&
                    (business as { readonly address: string }).address.trim().length > 0;
                const isSetupRequired = !hasActiveAdmin || !isConfiguredBusiness;
                setDesktopSetupRequired(isSetupRequired);
            })
            .catch(() => {
                if (isCurrent) setDesktopSetupRequired(false);
            });

        return () => {
            isCurrent = false;
        };
    }, [capabilities.isDemoMode, capabilities.isLanBrowser, setupRevision]);

    if (desktopSetupRequired === null) return null;

    return (
        <SessionProvider>
            <RecordStoreProvider>
                <Routes>
                    <Route
                        path="/setup"
                        element={
                            capabilities.isDemoMode || !setupRequired ? (
                                <Navigate replace to="/login" />
                            ) : (
                                <SetupPage
                                    onComplete={() => {
                                        setSetupRevision((current) => current + 1);
                                    }}
                                />
                            )
                        }
                    />
                    <Route
                        path="/login"
                        element={setupRequired ? <Navigate replace to="/setup" /> : <LoginPage />}
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
                    <Route
                        path="/"
                        element={<Navigate replace to={setupRequired ? '/setup' : '/login'} />}
                    />
                    <Route
                        path="*"
                        element={<Navigate replace to={setupRequired ? '/setup' : '/login'} />}
                    />
                </Routes>
            </RecordStoreProvider>
        </SessionProvider>
    );
};

export const App: FC = () => (
    <CapabilityProvider>
        <AppRoutes />
    </CapabilityProvider>
);
