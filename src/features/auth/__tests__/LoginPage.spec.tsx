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
import { SessionProvider } from '../SessionContext';

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
