/** @format */

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../AppRoutesSupport', async () => {
    const { Navigate, Route, Routes } = await import('react-router-dom');
    const { LoginPage } = await import('../features/auth/LoginPage');
    const { ProtectedRoute } = await import('../features/auth/ProtectedRoute');
    const { useSession } = await import('../features/auth/SessionContext');

    const DashboardStub = () => {
        const { operatorContext } = useSession();
        const displayName = operatorContext?.account.displayName ?? 'Operator';

        return <h1>{`Welcome back, ${displayName}.`}</h1>;
    };

    return {
        AppRouteFallback: () => <div className="app-screen-state" aria-busy="true" />,
        AppRouteTree: ({
            setupRequired,
        }: {
            readonly isDemoMode: boolean;
            readonly setupRequired: boolean;
            readonly onSetupComplete: () => void;
        }) => (
            <Routes>
                <Route
                    path="/login"
                    element={setupRequired ? <Navigate replace to="/setup" /> : <LoginPage />}
                />
                <Route
                    path="/app/dashboard"
                    element={
                        <ProtectedRoute roles={['Admin', 'SysAdmin']}>
                            <DashboardStub />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/app/records"
                    element={
                        <ProtectedRoute roles={['Admin', 'User']}>
                            <h1>Records</h1>
                        </ProtectedRoute>
                    }
                />
                <Route path="/" element={<Navigate replace to="/login" />} />
                <Route path="*" element={<Navigate replace to="/login" />} />
            </Routes>
        ),
    };
});

import { App } from '../App';

describe('App', () => {
    beforeEach(() => {
        window.localStorage.clear();
        Object.defineProperty(window, 'vaultBillRuntime', {
            configurable: true,
            value: 'desktop',
        });
        Object.defineProperty(window, 'vaultBillDesktop', {
            configurable: true,
            value: {
                closeWindow: vi.fn().mockResolvedValue(undefined),
                getBusinessSettings: vi.fn().mockResolvedValue({
                    companyName: 'VaultBill',
                    address: 'Chennai',
                }),
                getHostedWebUrl: vi.fn().mockResolvedValue('http://localhost'),
                getTrialStatus: vi.fn().mockResolvedValue({
                    isFullVersion: true,
                    isExpired: false,
                    accumulatedSeconds: 0,
                    remainingSeconds: 0,
                }),
                listAccounts: vi.fn().mockResolvedValue([
                    {
                        userId: 'admin_1',
                        username: 'admin',
                        displayName: 'Operations Admin',
                        role: 'Admin',
                        isActive: true,
                        passwordHash:
                            '5e800c5e134b84a0d73bd6f0d0f65b768f8a3afeba9c26ce3fe9b8d58fd027f1',
                    },
                ]),
                listRecords: vi.fn().mockResolvedValue([]),
                loginAccount: vi.fn().mockResolvedValue({
                    userId: 'admin_1',
                    username: 'admin',
                    displayName: 'Operations Admin',
                    role: 'Admin',
                    isActive: true,
                    passwordHash:
                        '5e800c5e134b84a0d73bd6f0d0f65b768f8a3afeba9c26ce3fe9b8d58fd027f1',
                }),
                minimizeWindow: vi.fn().mockResolvedValue(undefined),
                openHostedWeb: vi.fn().mockResolvedValue(undefined),
            } as const,
        });
        const portalRoot = document.createElement('div');
        portalRoot.id = 'portal-root';
        document.body.append(portalRoot);
    });

    afterEach(() => {
        delete (window as Partial<Window> & { vaultBillDesktop?: unknown }).vaultBillDesktop;
        delete (window as Partial<Window> & { vaultBillRuntime?: unknown }).vaultBillRuntime;
    });

    it('starts at login and enters the configured workspace', async () => {
        render(
            <MemoryRouter initialEntries={['/login']}>
                <App />
            </MemoryRouter>,
        );

        expect(await screen.findByRole('heading', { name: 'VaultBill' })).toBeVisible();

        if (import.meta.env.VITE_DEMO_MODE === 'true') {
            expect(screen.getByText('Demo User')).toBeVisible();
            fireEvent.click(screen.getByRole('button', { name: 'Start demo' }));

            expect(
                await screen.findByRole('heading', { name: /Welcome back, Demo User/u }),
            ).toBeVisible();
        } else {
            expect(
                await screen.findByRole('button', {
                    name: /Operator account Operations Admin/u,
                }),
            ).toBeVisible();
            fireEvent.change(screen.getByLabelText('Password'), {
                target: { value: '147085aA' },
            });
            fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

            expect(
                await screen.findByRole('heading', {
                    name: /Welcome back, Operations Admin\./u,
                }),
            ).toBeVisible();
        }

        expect(screen.queryByText(/Phase \d/u)).not.toBeInTheDocument();
    });
});
