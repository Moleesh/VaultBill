import { Navigate, Route, Routes } from 'react-router-dom';
import type { FC } from 'react';

import { CapabilityProvider } from './capability/CapabilityContext';
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

export const App: FC = () => (
  <CapabilityProvider>
    <SessionProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate replace to="dashboard" />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="records" element={<RecordsPage />} />
          <Route path="records/new" element={<RecordsPage />} />
          <Route path="records/:recordId" element={<RecordsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route
            path="builder"
            element={
              <ProtectedRoute roles={['SysAdmin']}>
                <BuilderPage />
              </ProtectedRoute>
            }
          />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="/" element={<Navigate replace to="/login" />} />
        <Route path="*" element={<Navigate replace to="/login" />} />
      </Routes>
    </SessionProvider>
  </CapabilityProvider>
);
