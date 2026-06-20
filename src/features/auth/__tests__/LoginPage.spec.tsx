/** @format */

import { createHash } from 'node:crypto';

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import type { CapabilityRegistry } from '../../../capability/Capability.types';
import { CapabilityProvider } from '../../../capability/CapabilityContext';
import { LoginPage } from '../LoginPage';
import type { OperatorAccount } from '../AccountTypes';
import { SessionProvider } from '../SessionContext';

const nonDemoCapabilities: CapabilityRegistry = {
    isDesktop: false,
    isHostedWeb: false,
    isDemoMode: false,
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
            <CapabilityProvider value={capabilities}>
                <SessionProvider>{children}</SessionProvider>
            </CapabilityProvider>
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
    });

    it('submits the login form when Enter is pressed', async () => {
        setDesktopBridge([{ ...adminAccount, passwordHash: sysAdminAccount.passwordHash }]);

        render(
            <MemoryRouter initialEntries={['/login']}>
                <CapabilityProvider value={desktopCapabilities}>
                    <SessionProvider>
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/app/dashboard" element={<h1>Dashboard</h1>} />
                        </Routes>
                    </SessionProvider>
                </CapabilityProvider>
            </MemoryRouter>,
        );

        const password = '147085aA';
        expect(
            await screen.findByRole('button', {
                name: /Operator account Operations Admin/i,
            }),
        ).toBeVisible();
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
        fireEvent.click(
            screen.getByRole('button', {
                name: /Operator account Operations Admin/i,
            }),
        );
        fireEvent.click(await screen.findByRole('option', { name: /System Administrator/i }));

        expect(
            await screen.findByRole('button', {
                name: /Operator account System Administrator/i,
            }),
        ).toBeVisible();
        expect(await screen.findByLabelText('Password')).toBeVisible();
    });
});
