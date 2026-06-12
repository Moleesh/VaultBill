/** @format */

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';

import type { CapabilityRegistry } from '../../../capability/Capability.types';
import { CapabilityProvider } from '../../../capability/CapabilityContext';
import { ContextualHelp } from '../../../components/ContextualHelp';
import { SessionProvider } from '../../auth/SessionContext';
import { SettingsPage } from '../SettingsPage';
import { RecordStoreProvider } from '../../records/RecordStoreContext';

const webCapabilities: CapabilityRegistry = {
    isDesktop: false,
    isLanBrowser: false,
    isDemoMode: true,
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
    ...webCapabilities,
    isDesktop: true,
    isDemoMode: false,
    canListPrinters: true,
    canSelectExactPrinter: true,
    canDownloadPdf: true,
    canBackup: true,
    canRestore: true,
    canLanServer: true,
    canSmsIntegration: true,
    canGspIntegration: true,
    hasLocalDb: true,
};

const renderPage = (children: ReactNode, capabilities = webCapabilities) =>
    render(
        <MemoryRouter>
            <CapabilityProvider value={capabilities}>
                <SessionProvider>
                    <RecordStoreProvider>{children}</RecordStoreProvider>
                </SessionProvider>
            </CapabilityProvider>
        </MemoryRouter>,
    );

describe('settings UI', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="portal-root"></div>';
        window.localStorage.clear();
        window.localStorage.setItem('vaultbill.operator', 'demo_user');
    });

    it('shows capability-aware settings and help', () => {
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
        window.localStorage.setItem('vaultbill.operator', 'admin_1');
        const fullWebCapabilities = {
            ...webCapabilities,
            isDemoMode: false,
            isLanBrowser: false,
            canSmsIntegration: true,
            canGspIntegration: true,
        };
        renderPage(
            <>
                <SettingsPage />
                <ContextualHelp
                    isOpen
                    onClose={() => undefined}
                    onOpen={() => undefined}
                    page="records"
                    role="SysAdmin"
                />
            </>,
            fullWebCapabilities,
        );

        expect(screen.getByRole('heading', { name: 'Accounts and access' })).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Create backup' })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Business' })).not.toBeInTheDocument();
        fireEvent.change(screen.getByPlaceholderText('Search actions and topics'), {
            target: { value: 'PDF' },
        });
        expect(screen.getByText('PDF output')).toBeVisible();
    });

    it('shows desktop printer and backup sections in settings', () => {
        window.localStorage.setItem(
            'vaultbill.accounts',
            JSON.stringify([
                {
                    userId: 'sysadmin_1',
                    username: 'sysadmin',
                    displayName: 'System Administrator',
                    role: 'SysAdmin',
                    isActive: true,
                },
            ]),
        );
        window.localStorage.setItem('vaultbill.operator', 'sysadmin_1');

        renderPage(<SettingsPage />, desktopCapabilities);

        expect(screen.getByText('Preferred printer')).toBeVisible();
        expect(screen.getByText('GST and GSP')).toBeVisible();
        expect(screen.getByText('SMS provider')).toBeVisible();
        expect(screen.getByRole('heading', { name: 'Backup and restore' })).toBeVisible();
        expect(screen.getByRole('heading', { name: 'Backup password' })).toBeVisible();
    });
});
