/** @format */
/* eslint-disable max-lines */

import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { fireEvent, render, screen } from '@testing-library/react';
import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CapabilityRegistry } from '../../../capability/Capability.types';
import { CapabilityProvider } from '../../../capability/CapabilityContext';
import { TestQueryProvider } from '../../../test/TestQueryProvider';
import type { OperatorAccount } from '../AccountTypes';
import { LoginPage } from '../LoginPage';
import { SessionProvider, useSession } from '../SessionContext';

const nonDemoCapabilities: CapabilityRegistry = {
    isDesktop: false,
    isHostedWeb: false,
    isDemoMode: false,
    runtimePlatform: 'hosted-web',
    canListPrinters: false,
    canSelectExactPrinter: false,
    canBrowserPrint: true,
    canDownloadPdf: false,
    canBackup: false,
    canRestore: false,
    canUsbSignaturePad: false,
    canLanServer: false,
    canSmsIntegration: false,
    canGspIntegration: false,
    hasLocalDb: false,
};

const desktopCapabilities: CapabilityRegistry = {
    ...nonDemoCapabilities,
    isDesktop: true,
    runtimePlatform: 'desktop',
    canListPrinters: true,
    canSelectExactPrinter: true,
    canDownloadPdf: true,
    canBackup: true,
    canRestore: true,
    canUsbSignaturePad: true,
    canLanServer: true,
    hasLocalDb: true,
};

const demoCapabilities: CapabilityRegistry = {
    ...nonDemoCapabilities,
    isDemoMode: true,
    runtimePlatform: 'demo',
};

const adminAccount = {
    userId: 'admin_1',
    username: 'admin',
    displayName: 'Operations Admin',
    role: 'Admin',
    isActive: true,
} as const;

const sysAdminAccount = {
    userId: 'sysadmin_1',
    username: 'sysadmin',
    displayName: 'System Administrator',
    role: 'SysAdmin',
    isActive: true,
    passwordHash: createHash('sha256').update('147085aA').digest('hex'),
} as const;

const renderPage = (children: ReactNode, capabilities = nonDemoCapabilities) =>
    render(
        <MemoryRouter initialEntries={['/login']}>
            <TestQueryProvider>
                <CapabilityProvider value={capabilities}>
                    <SessionProvider>{children}</SessionProvider>
                </CapabilityProvider>
            </TestQueryProvider>
        </MemoryRouter>,
    );

const SessionLogoutButton = () => {
    const { logout } = useSession();

    return (
        <button onClick={logout} type="button">
            Log out now
        </button>
    );
};

const setDesktopBridge = (accounts: readonly OperatorAccount[]) => {
    Object.defineProperty(window, 'vaultBillDesktop', {
        configurable: true,
        value: {
            activateLicense: vi.fn().mockResolvedValue(undefined),
            closeWindow: vi.fn().mockResolvedValue(undefined),
            listAccounts: vi.fn().mockResolvedValue(accounts),
            loginAccount: vi.fn().mockImplementation((userId: string) => {
                const account = accounts.find((candidate) => candidate.userId === userId);
                return account
                    ? Promise.resolve(account)
                    : Promise.reject(new Error('Unknown account.'));
            }),
            minimizeWindow: vi.fn().mockResolvedValue(undefined),
        } as const,
    });
};

describe('login UI', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="portal-root"></div>';
        window.localStorage.clear();
    });

    afterEach(() => {
        delete (window as Partial<Window> & { vaultBillDesktop?: unknown }).vaultBillDesktop;
        delete (window as Partial<Window> & { vaultBillRuntime?: unknown }).vaultBillRuntime;
    });

    it('submits the login form when Enter is pressed', async () => {
        setDesktopBridge([{ ...adminAccount, passwordHash: sysAdminAccount.passwordHash }]);

        render(
            <MemoryRouter initialEntries={['/login']}>
                <TestQueryProvider>
                    <CapabilityProvider value={desktopCapabilities}>
                        <SessionProvider>
                            <Routes>
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/app/dashboard" element={<h1>Dashboard</h1>} />
                            </Routes>
                        </SessionProvider>
                    </CapabilityProvider>
                </TestQueryProvider>
            </MemoryRouter>,
        );

        const password = '147085aA';
        expect(
            await screen.findByRole('button', {
                name: /Operator account Operations Admin/i,
            }),
        ).toBeVisible();
        fireEvent.click(
            screen.getByRole('button', {
                name: /Operator account Operations Admin/i,
            }),
        );
        fireEvent.click(screen.getByRole('option', { name: /Operations Admin/i }));
        const passwordInput = screen.getByLabelText('Password');
        fireEvent.change(passwordInput, { target: { value: password } });
        fireEvent.keyDown(passwordInput, {
            key: 'Enter',
            code: 'Enter',
            charCode: 13,
        });
        const loginForm = passwordInput.closest('form');
        if (!loginForm) {
            throw new Error('Login form was not found.');
        }
        fireEvent.submit(loginForm);

        expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeVisible();
    });

    it('starts the browser demo with one click', async () => {
        render(
            <MemoryRouter initialEntries={['/login']}>
                <TestQueryProvider>
                    <CapabilityProvider value={demoCapabilities}>
                        <SessionProvider>
                            <Routes>
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/app/dashboard" element={<h1>Dashboard</h1>} />
                            </Routes>
                        </SessionProvider>
                    </CapabilityProvider>
                </TestQueryProvider>
            </MemoryRouter>,
        );

        fireEvent.click(await screen.findByRole('button', { name: 'Start demo' }));

        expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeVisible();
    });

    it('uses the role default page instead of restoring the remembered desktop tab', async () => {
        setDesktopBridge([adminAccount]);
        window.localStorage.setItem('vaultbill.desktop.last-app-tab', '/app/settings');

        render(
            <MemoryRouter initialEntries={['/login']}>
                <TestQueryProvider>
                    <CapabilityProvider value={desktopCapabilities}>
                        <SessionProvider>
                            <Routes>
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/app/dashboard" element={<h1>Dashboard</h1>} />
                                <Route path="/app/settings" element={<h1>Settings</h1>} />
                            </Routes>
                        </SessionProvider>
                    </CapabilityProvider>
                </TestQueryProvider>
            </MemoryRouter>,
        );

        fireEvent.click(
            await screen.findByRole('button', {
                name: /Operator account Operations Admin/i,
            }),
        );
        fireEvent.click(screen.getByRole('option', { name: /Operations Admin/i }));
        fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

        expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeVisible();
    });

    it('keeps the last selected operator after desktop logout', async () => {
        const secondAdminAccount = {
            ...adminAccount,
            userId: 'admin_2',
            username: 'second-admin',
            displayName: 'Second Admin',
        } as const;
        setDesktopBridge([adminAccount, secondAdminAccount]);
        window.localStorage.setItem('vaultbill.login.last-operator', secondAdminAccount.userId);

        render(
            <MemoryRouter
                initialEntries={[
                    {
                        pathname: '/login',
                        state: { resetLoginForm: true },
                    },
                ]}
            >
                <TestQueryProvider>
                    <CapabilityProvider value={desktopCapabilities}>
                        <SessionProvider>
                            <LoginPage />
                        </SessionProvider>
                    </CapabilityProvider>
                </TestQueryProvider>
            </MemoryRouter>,
        );

        expect(
            await screen.findByRole('button', {
                name: /Operator account Second Admin/i,
            }),
        ).toBeVisible();
        expect(screen.getByRole('button', { name: 'Log in' })).not.toBeDisabled();
    });

    it('ignores stale tab return paths after desktop logout', async () => {
        setDesktopBridge([adminAccount]);
        window.sessionStorage.setItem('vaultbill.desktop.logout-fresh-login', 'true');

        render(
            <MemoryRouter
                initialEntries={[
                    {
                        pathname: '/login',
                        state: { from: '/app/settings' },
                    },
                ]}
            >
                <TestQueryProvider>
                    <CapabilityProvider value={desktopCapabilities}>
                        <SessionProvider>
                            <Routes>
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/app/dashboard" element={<h1>Dashboard</h1>} />
                                <Route path="/app/settings" element={<h1>Settings</h1>} />
                            </Routes>
                        </SessionProvider>
                    </CapabilityProvider>
                </TestQueryProvider>
            </MemoryRouter>,
        );

        await screen.findByRole('button', {
            name: /Operator account Operations Admin/i,
        });
        fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

        expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeVisible();
        expect(screen.queryByRole('heading', { name: 'Settings' })).toBeNull();
        expect(window.sessionStorage.getItem('vaultbill.desktop.logout-fresh-login')).toBeNull();
    });

    it('remembers the operator selected during successful login', async () => {
        setDesktopBridge([adminAccount]);

        render(
            <MemoryRouter initialEntries={['/login']}>
                <TestQueryProvider>
                    <CapabilityProvider value={desktopCapabilities}>
                        <SessionProvider>
                            <Routes>
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/app/dashboard" element={<h1>Dashboard</h1>} />
                            </Routes>
                        </SessionProvider>
                    </CapabilityProvider>
                </TestQueryProvider>
            </MemoryRouter>,
        );

        await screen.findByRole('button', {
            name: /Operator account Operations Admin/i,
        });
        fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

        expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeVisible();
        expect(window.localStorage.getItem('vaultbill.login.last-operator')).toBe(
            adminAccount.userId,
        );
    });

    it('clears the desktop operator when logging out', async () => {
        setDesktopBridge([adminAccount]);
        window.localStorage.setItem('vaultbill.operator', adminAccount.userId);

        render(
            <MemoryRouter initialEntries={['/login']}>
                <TestQueryProvider>
                    <CapabilityProvider value={desktopCapabilities}>
                        <SessionProvider>
                            <SessionLogoutButton />
                        </SessionProvider>
                    </CapabilityProvider>
                </TestQueryProvider>
            </MemoryRouter>,
        );

        fireEvent.click(await screen.findByRole('button', { name: 'Log out now' }));

        expect(window.localStorage.getItem('vaultbill.operator')).toBeNull();
    });

    it('keeps the desktop operator during refresh bootstrap', async () => {
        setDesktopBridge([adminAccount]);
        window.localStorage.setItem('vaultbill.operator', adminAccount.userId);

        render(
            <MemoryRouter initialEntries={['/login']}>
                <TestQueryProvider>
                    <CapabilityProvider value={desktopCapabilities}>
                        <SessionProvider>
                            <SessionLogoutButton />
                        </SessionProvider>
                    </CapabilityProvider>
                </TestQueryProvider>
            </MemoryRouter>,
        );

        await screen.findByRole('button', { name: 'Log out now' });

        expect(window.localStorage.getItem('vaultbill.operator')).toBe(adminAccount.userId);
    });

    it('shows the account username as supporting detail in the operator selector', async () => {
        setDesktopBridge([adminAccount]);

        renderPage(<LoginPage />, desktopCapabilities);

        fireEvent.click(
            await screen.findByRole('button', {
                name: /Operator account Operations Admin/i,
            }),
        );
        expect(screen.getByRole('option', { name: /Operations Admin/i })).toBeVisible();
        expect(screen.getByText('admin · Admin')).toBeVisible();
    });

    it('reveals the hidden SysAdmin account after F8 is pressed', async () => {
        setDesktopBridge([sysAdminAccount, adminAccount]);

        renderPage(<LoginPage />, desktopCapabilities);

        expect(
            await screen.findByRole('button', {
                name: /Operator account Operations Admin/i,
            }),
        ).toBeVisible();
        expect(screen.queryByRole('option', { name: /System Administrator/i })).toBeNull();
        fireEvent.keyDown(window, { key: 'F8', code: 'F8' });

        expect(
            await screen.findByRole('button', {
                name: /Operator account System Administrator/i,
            }),
        ).toBeVisible();
        expect(screen.getByRole('status')).toHaveTextContent('System Administrator unlocked');
        expect(await screen.findByLabelText('Password')).toBeVisible();
    });

    it('shows working desktop chrome when the runtime marker is present even before desktop capabilities resolve', async () => {
        setDesktopBridge([adminAccount]);
        Object.defineProperty(window, 'vaultBillRuntime', {
            configurable: true,
            value: 'desktop',
        });

        renderPage(<LoginPage />, nonDemoCapabilities);

        fireEvent.click(await screen.findByRole('button', { name: 'Minimize to taskbar' }));
        fireEvent.click(screen.getByRole('button', { name: 'Close to tray' }));

        expect(window.vaultBillDesktop?.minimizeWindow).toHaveBeenCalledTimes(1);
        expect(window.vaultBillDesktop?.closeWindow).toHaveBeenCalledTimes(1);
    });

    it('opens the sign-in help modal from the login actions', async () => {
        setDesktopBridge([adminAccount]);

        renderPage(<LoginPage />, desktopCapabilities);

        fireEvent.click(await screen.findByRole('button', { name: 'Sign-in help' }));

        expect(await screen.findByRole('heading', { name: 'Sign-in help' })).toBeVisible();
        expect(screen.getByText(/Choose your account, enter a password/i)).toBeVisible();
    });

    it('keeps the desktop runtime on bridge-backed accounts when no active desktop accounts exist', async () => {
        setDesktopBridge([]);
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        Object.defineProperty(window, 'fetch', {
            configurable: true,
            value: fetchMock,
        });

        renderPage(<LoginPage />, desktopCapabilities);

        expect(
            await screen.findByRole('button', {
                name: /Operator account Choose/i,
            }),
        ).toBeVisible();
        expect(screen.queryByRole('button', { name: /Operator account .*Admin/i })).toBeNull();
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('refreshes the login account details after setup data changes', async () => {
        let desktopAccounts: readonly OperatorAccount[] = [
            {
                ...adminAccount,
                userId: 'admin_original',
                displayName: 'Original Admin',
                username: 'original',
            },
        ];

        Object.defineProperty(window, 'vaultBillDesktop', {
            configurable: true,
            value: {
                activateLicense: vi.fn().mockResolvedValue(undefined),
                closeWindow: vi.fn().mockResolvedValue(undefined),
                listAccounts: vi.fn().mockImplementation(() => Promise.resolve(desktopAccounts)),
                loginAccount: vi.fn().mockImplementation((userId: string) => {
                    const account = desktopAccounts.find(
                        (candidate) => candidate.userId === userId,
                    );
                    return account
                        ? Promise.resolve(account)
                        : Promise.reject(new Error('Unknown account.'));
                }),
                minimizeWindow: vi.fn().mockResolvedValue(undefined),
            } as const,
        });

        const { rerender } = render(
            <MemoryRouter initialEntries={['/login']}>
                <TestQueryProvider>
                    <CapabilityProvider value={desktopCapabilities}>
                        <SessionProvider refreshRevision={0}>
                            <LoginPage />
                        </SessionProvider>
                    </CapabilityProvider>
                </TestQueryProvider>
            </MemoryRouter>,
        );

        expect(
            await screen.findByRole('button', {
                name: /Operator account Original Admin/i,
            }),
        ).toBeVisible();

        desktopAccounts = [
            {
                ...adminAccount,
                userId: 'admin_latest',
                displayName: 'Latest Admin',
                username: 'latest',
            },
        ];

        rerender(
            <MemoryRouter initialEntries={['/login']}>
                <TestQueryProvider>
                    <CapabilityProvider value={desktopCapabilities}>
                        <SessionProvider refreshRevision={1}>
                            <LoginPage />
                        </SessionProvider>
                    </CapabilityProvider>
                </TestQueryProvider>
            </MemoryRouter>,
        );

        expect(
            await screen.findByRole('button', {
                name: /Operator account Latest Admin/i,
            }),
        ).toBeVisible();
    });

    it('keeps the login page on the workspace theme instead of reusing a personal theme', async () => {
        Object.defineProperty(window, 'vaultBillDesktop', {
            configurable: true,
            value: {
                activateLicense: vi.fn().mockResolvedValue(undefined),
                closeWindow: vi.fn().mockResolvedValue(undefined),
                getBusinessSettings: vi.fn().mockResolvedValue({
                    companyName: 'VaultBill',
                    address: 'Chennai',
                    theme: 'teal-flow',
                }),
                listAccounts: vi.fn().mockResolvedValue([adminAccount]),
                loginAccount: vi.fn().mockResolvedValue(adminAccount),
                minimizeWindow: vi.fn().mockResolvedValue(undefined),
            } as const,
        });
        window.localStorage.setItem('vaultbill.theme', 'midnight-ink');
        window.localStorage.setItem('vaultbill.theme.user.admin_1', 'midnight-ink');

        renderPage(<LoginPage />, desktopCapabilities);

        expect(
            await screen.findByRole('button', {
                name: /Operator account Operations Admin/i,
            }),
        ).toBeVisible();
        expect(document.documentElement.dataset.theme).toBe('teal-flow');
    });

    it('opens a confirmation before re-entering setup with F9', async () => {
        setDesktopBridge([adminAccount]);
        const openSetupWizard = vi.fn();

        renderPage(<LoginPage onOpenSetupWizard={openSetupWizard} />, desktopCapabilities);

        await screen.findByRole('button', {
            name: /Operator account Operations Admin/i,
        });
        fireEvent.keyDown(window, { key: 'F9', code: 'F9' });

        expect(
            screen.getByRole('heading', {
                name: 'Return to setup wizard',
            }),
        ).toBeVisible();

        fireEvent.click(screen.getByRole('button', { name: 'Open setup' }));

        expect(openSetupWizard).toHaveBeenCalledTimes(1);
    });

    it('ignores F9 in the browser runtime', async () => {
        setDesktopBridge([adminAccount]);
        const openSetupWizard = vi.fn();

        renderPage(<LoginPage onOpenSetupWizard={openSetupWizard} />, nonDemoCapabilities);

        await screen.findByRole('button', {
            name: /Operator account Operations Admin/i,
        });
        fireEvent.keyDown(window, { key: 'F9', code: 'F9' });

        expect(
            screen.queryByRole('heading', {
                name: 'Return to setup wizard',
            }),
        ).toBeNull();
        expect(openSetupWizard).not.toHaveBeenCalled();
    });
});
