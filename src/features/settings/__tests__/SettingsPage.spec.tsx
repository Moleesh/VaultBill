/** @format */

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import type { CapabilityRegistry } from '../../../capability/Capability.types';
import { CapabilityProvider } from '../../../capability/CapabilityContext';
import { ContextualHelp } from '../../../components/ContextualHelp';
import { SessionContext } from '../../auth/SessionContext';
import { SettingsPage } from '../SettingsPage';
import { RecordStoreProvider } from '../../records/RecordStoreContext';
import { createTestSession } from '../../../test/TestSession';

const webCapabilities: CapabilityRegistry = {
    isDesktop: false,
    isHostedWeb: false,
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
} as const;

const renderPage = (
    children: ReactNode,
    session = createTestSession(adminAccount),
    capabilities = webCapabilities,
) =>
    render(
        <MemoryRouter>
            <CapabilityProvider value={capabilities}>
                <SessionContext.Provider value={session}>
                    <RecordStoreProvider>{children}</RecordStoreProvider>
                </SessionContext.Provider>
            </CapabilityProvider>
        </MemoryRouter>,
    );

describe('settings UI', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="portal-root"></div>';
        window.localStorage.clear();
    });

    afterEach(() => {
        delete (window as Partial<Window> & { vaultBillDesktop?: unknown }).vaultBillDesktop;
    });

    it('shows capability-aware settings and help', () => {
        const fullWebCapabilities = {
            ...webCapabilities,
            isDemoMode: false,
            isHostedWeb: false,
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
            createTestSession(adminAccount),
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

    it('shows desktop printer and backup sections in settings', async () => {
        Object.defineProperty(window, 'vaultBillDesktop', {
            configurable: true,
            value: {
                activateLicense: vi.fn().mockResolvedValue(undefined),
                configureLocalApi: vi.fn().mockResolvedValue(undefined),
                getBusinessSettings: vi.fn().mockResolvedValue({
                    companyName: 'VaultBill',
                    address: 'Chennai',
                    gstin: '',
                    theme: 'teal-flow',
                    outputTarget: 'SystemPrinter',
                    preferredPrinterName: 'Front Desk Printer',
                    includeDraftsInReports: false,
                }),
                getCredentialStatus: vi.fn().mockResolvedValue({
                    sysAdminUsesDefaultPassword: false,
                    backupUsesDefaultPassword: false,
                }),
                getHostedWebSettings: vi.fn().mockResolvedValue({ lanEnabled: true }),
                getSecretsSettings: vi.fn().mockResolvedValue({ secrets: [] }),
                getTrialStatus: vi.fn().mockResolvedValue({
                    isFullVersion: true,
                    isExpired: false,
                    remainingSeconds: 0,
                }),
                listPrinters: vi.fn().mockResolvedValue([
                    {
                        id: 'front-desk',
                        name: 'Front Desk Printer',
                        isDefault: true,
                    },
                ]),
                saveBusinessSettings: vi.fn().mockResolvedValue(undefined),
                saveSecretsSettings: vi.fn().mockResolvedValue(undefined),
            } as const,
        });

        renderPage(
            <SettingsPage />,
            createTestSession(sysAdminAccount, [sysAdminAccount]),
            desktopCapabilities,
        );

        expect(await screen.findByText('Preferred printer')).toBeVisible();
        expect(screen.getByText(/Store shared keys and values here/i)).toBeVisible();
        expect(screen.getByText('Key')).toBeVisible();
        expect(screen.getByRole('heading', { name: 'Backup and restore' })).toBeVisible();
        expect(screen.getByRole('heading', { name: 'Backup password' })).toBeVisible();
        expect(screen.getByRole('button', { name: /Add operator/i })).toBeDisabled();
    });
});
