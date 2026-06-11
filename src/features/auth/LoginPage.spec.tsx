/** @format */

import { createHash } from 'node:crypto';

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';

import type { CapabilityRegistry } from '../../capability/Capability.types';
import { CapabilityProvider } from '../../capability/CapabilityContext';
import { LoginPage } from './LoginPage';
import { SessionProvider } from './SessionContext';

const nonDemoCapabilities: CapabilityRegistry = {
    isDesktop: false,
    isLanBrowser: false,
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

const renderPage = (children: ReactNode) =>
    render(
        <MemoryRouter initialEntries={['/login']}>
            <CapabilityProvider value={nonDemoCapabilities}>
                <SessionProvider>{children}</SessionProvider>
            </CapabilityProvider>
        </MemoryRouter>,
    );

describe('login UI', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="portal-root"></div>';
        window.localStorage.clear();
    });

    it('submits the login form when Enter is pressed', async () => {
        const password = '147085aA';
        const passwordHash = createHash('sha256').update(password).digest('hex');

        window.localStorage.setItem(
            'vaultbill.accounts',
            JSON.stringify([
                {
                    userId: 'admin_1',
                    username: 'admin',
                    displayName: 'Operations Admin',
                    role: 'Admin',
                    isActive: true,
                    passwordHash,
                },
            ]),
        );

        render(
            <MemoryRouter initialEntries={['/login']}>
                <CapabilityProvider value={nonDemoCapabilities}>
                    <SessionProvider>
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/app/dashboard" element={<h1>Dashboard</h1>} />
                        </Routes>
                    </SessionProvider>
                </CapabilityProvider>
            </MemoryRouter>,
        );

        const passwordInput = screen.getByLabelText('Password');
        fireEvent.change(passwordInput, { target: { value: password } });
        fireEvent.keyDown(passwordInput, {
            key: 'Enter',
            code: 'Enter',
            charCode: 13,
        });
        fireEvent.submit(passwordInput.closest('form') as HTMLFormElement);

        expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeVisible();
    });

    it('shows the account username as supporting detail in the operator selector', () => {
        window.localStorage.setItem(
            'vaultbill.accounts',
            JSON.stringify([
                {
                    userId: 'admin_1',
                    username: 'admin',
                    displayName: 'Operations Admin',
                    role: 'Admin',
                    isActive: true,
                },
            ]),
        );

        renderPage(<LoginPage />);

        fireEvent.click(screen.getByRole('button', { name: /Operator account Operations Admin/i }));
        expect(screen.getByRole('option', { name: /Operations Admin/i })).toBeVisible();
        expect(screen.getByText('admin · Admin')).toBeVisible();
    });
});
