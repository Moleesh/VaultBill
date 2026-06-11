/** @format */

import { Navigate, Route, Routes } from 'react-router-dom';
import { useState } from 'react';
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
import { isFirstRunSetupRequired, SetupPage } from './features/setup/SetupPage';

const AppRoutes: FC = () => {
    const capabilities = useCapabilities();
    const [, setSetupRevision] = useState(0);
    const setupRequired = isFirstRunSetupRequired(
        capabilities.isDemoMode,
        capabilities.isLanBrowser,
    );

    return (
        <SessionProvider>
            <RecordStoreProvider>
                <Routes>
                    <Route
                        path="/setup"
                        element={
                            capabilities.isDemoMode ? (
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
