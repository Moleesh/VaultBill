/** @format */

import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CapabilityRegistry } from '../../../capability/Capability.types';
import { CapabilityProvider } from '../../../capability/CapabilityContext';
import { ContextualHelp } from '../../../components/ContextualHelp';
import { TestQueryProvider } from '../../../test/TestQueryProvider';
import { createTestSession } from '../../../test/TestSession';
import { SessionContext } from '../../auth/SessionContext';
import { RecordStoreProvider } from '../../records/RecordStoreContext';
import { SettingsPage } from '../SettingsPage';

const webCapabilities: CapabilityRegistry = {
    isDesktop: false,
    isHostedWeb: false,
    isDemoMode: true,
    runtimePlatform: 'demo',
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
    runtimePlatform: 'desktop',
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
    act(async () => {
        render(
            <MemoryRouter>
                <TestQueryProvider>
                    <CapabilityProvider value={capabilities}>
                        <SessionContext.Provider value={session}>
                            <RecordStoreProvider>{children}</RecordStoreProvider>
                        </SessionContext.Provider>
                    </CapabilityProvider>
                </TestQueryProvider>
            </MemoryRouter>,
        );
        await Promise.resolve();
    });

describe('settings UI', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="portal-root"></div>';
        window.localStorage.clear();
        window.history.replaceState(null, '', '/');
    });

    afterEach(() => {
        delete (window as Partial<Window> & { vaultBillDesktop?: unknown }).vaultBillDesktop;
    });

    it('shows capability-aware settings and help', async () => {
        const fullWebCapabilities = {
            ...webCapabilities,
            isDemoMode: false,
            isHostedWeb: false,
            canSmsIntegration: true,
            canGspIntegration: true,
        };
        await renderPage(
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

        expect(screen.queryByRole('navigation', { name: 'Settings sections' })).toBeNull();
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
                getHostedWebServerStatus: vi.fn().mockResolvedValue({
                    isRunning: true,
                    url: 'http://127.0.0.1/VaultBill/',
                }),
                getHostedWebSettings: vi.fn().mockResolvedValue({
                    autoStart: true,
                    lanEnabled: true,
                    passwordRequired: false,
                    port: 80,
                }),
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

        await renderPage(
            <SettingsPage />,
            createTestSession(sysAdminAccount, [sysAdminAccount]),
            desktopCapabilities,
        );

        expect(await screen.findByText('Preferred printer')).toBeVisible();
        expect(await screen.findByText('Full version activated.')).toBeVisible();
        expect(await screen.findByRole('heading', { name: 'Reports' })).toBeVisible();
        await waitFor(() => {
            expect(window.vaultBillDesktop?.getCredentialStatus).toHaveBeenCalledTimes(1);
            expect(window.vaultBillDesktop?.getTrialStatus).toHaveBeenCalledTimes(1);
            expect(window.vaultBillDesktop?.getHostedWebSettings).toHaveBeenCalledTimes(1);
            expect(window.vaultBillDesktop?.getHostedWebServerStatus).toHaveBeenCalledTimes(1);
        });
        expect(screen.getByText(/Store shared keys and values here/i)).toBeVisible();
        expect(screen.getByText('Key')).toBeVisible();
        expect(screen.getByRole('heading', { name: 'Backup and restore' })).toBeVisible();
        expect(screen.getByRole('heading', { name: 'Backup password' })).toBeVisible();
        expect(screen.getByRole('button', { name: /Add operator/i })).toBeDisabled();
    });

    it('keeps SysAdmin settings tabs clickable and active', async () => {
        window.HTMLElement.prototype.scrollIntoView = vi.fn();
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
                    preferredPrinterName: '',
                    includeDraftsInReports: false,
                }),
                getCredentialStatus: vi.fn().mockResolvedValue({
                    sysAdminUsesDefaultPassword: false,
                    backupUsesDefaultPassword: false,
                }),
                getHostedWebServerStatus: vi.fn().mockResolvedValue({
                    isRunning: true,
                    url: 'http://127.0.0.1/VaultBill/',
                }),
                getHostedWebSettings: vi.fn().mockResolvedValue({
                    autoStart: true,
                    lanEnabled: true,
                    passwordRequired: false,
                    port: 80,
                }),
                getSecretsSettings: vi.fn().mockResolvedValue({ secrets: [] }),
                getTrialStatus: vi.fn().mockResolvedValue({
                    isFullVersion: true,
                    isExpired: false,
                    remainingSeconds: 0,
                }),
                listPrinters: vi.fn().mockResolvedValue([]),
                saveBusinessSettings: vi.fn().mockResolvedValue(undefined),
                saveSecretsSettings: vi.fn().mockResolvedValue(undefined),
            } as const,
        });

        await renderPage(
            <SettingsPage />,
            createTestSession(sysAdminAccount, [sysAdminAccount]),
            desktopCapabilities,
        );

        const businessTab = await screen.findByRole('link', { name: 'Business' });
        const securityTab = screen.getByRole('link', { name: 'Security' });
        const backupTab = screen.getByRole('link', { name: 'Backup' });
        const secretsTab = screen.getByRole('link', { name: 'Secrets' });

        expect(businessTab).toHaveAttribute('aria-current', 'page');
        fireEvent.click(backupTab);
        expect(backupTab).toHaveAttribute('aria-current', 'page');
        expect(window.location.hash).toBe('#backup');
        fireEvent.click(securityTab);
        expect(securityTab).toHaveAttribute('aria-current', 'page');
        expect(window.location.hash).toBe('#security');
        expect(secretsTab).toBeVisible();
    });

    it('applies the selected business theme swatch immediately', async () => {
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
                    preferredPrinterName: '',
                    includeDraftsInReports: false,
                }),
                getCredentialStatus: vi.fn().mockResolvedValue({
                    sysAdminUsesDefaultPassword: false,
                    backupUsesDefaultPassword: false,
                }),
                getHostedWebServerStatus: vi.fn().mockResolvedValue({
                    isRunning: true,
                    url: 'http://127.0.0.1/VaultBill/',
                }),
                getHostedWebSettings: vi.fn().mockResolvedValue({
                    autoStart: true,
                    lanEnabled: true,
                    passwordRequired: false,
                    port: 80,
                }),
                getSecretsSettings: vi.fn().mockResolvedValue({ secrets: [] }),
                getTrialStatus: vi.fn().mockResolvedValue({
                    isFullVersion: true,
                    isExpired: false,
                    remainingSeconds: 0,
                }),
                listPrinters: vi.fn().mockResolvedValue([]),
                saveBusinessSettings: vi.fn().mockResolvedValue(undefined),
                saveSecretsSettings: vi.fn().mockResolvedValue(undefined),
            } as const,
        });

        await renderPage(
            <SettingsPage />,
            createTestSession(sysAdminAccount, [sysAdminAccount]),
            desktopCapabilities,
        );

        expect(document.documentElement.dataset.theme).toBe('teal-flow');

        fireEvent.click(await screen.findByRole('radio', { name: 'Sandstone Ledger' }));

        await waitFor(() => {
            expect(document.documentElement.dataset.theme).toBe('sandstone-ledger');
        });
    });

    it('limits Admin settings tabs to the security section', async () => {
        await renderPage(<SettingsPage />, createTestSession(adminAccount), desktopCapabilities);

        expect(screen.queryByRole('link', { name: 'Security' })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Business' })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Backup' })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Secrets' })).not.toBeInTheDocument();
        expect(screen.queryByRole('navigation', { name: 'Settings sections' })).toBeNull();
    });

    it('enables Add operator as soon as the required operator fields are filled', async () => {
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
                    preferredPrinterName: '',
                    includeDraftsInReports: false,
                }),
                getCredentialStatus: vi.fn().mockResolvedValue({
                    sysAdminUsesDefaultPassword: false,
                    backupUsesDefaultPassword: false,
                }),
                getHostedWebServerStatus: vi.fn().mockResolvedValue({
                    isRunning: true,
                    url: 'http://127.0.0.1/VaultBill/',
                }),
                getHostedWebSettings: vi.fn().mockResolvedValue({
                    autoStart: true,
                    lanEnabled: true,
                    passwordRequired: false,
                    port: 80,
                }),
                getSecretsSettings: vi.fn().mockResolvedValue({ secrets: [] }),
                getTrialStatus: vi.fn().mockResolvedValue({
                    isFullVersion: true,
                    isExpired: false,
                    remainingSeconds: 0,
                }),
                listPrinters: vi.fn().mockResolvedValue([]),
                saveBusinessSettings: vi.fn().mockResolvedValue(undefined),
                saveSecretsSettings: vi.fn().mockResolvedValue(undefined),
            } as const,
        });

        await renderPage(
            <SettingsPage />,
            createTestSession(sysAdminAccount, [sysAdminAccount]),
            desktopCapabilities,
        );

        const addOperatorButton = await screen.findByRole('button', { name: /Add operator/i });
        expect(addOperatorButton).toBeDisabled();

        fireEvent.change(screen.getByLabelText('Username'), {
            target: { value: 'operator-one' },
        });
        fireEvent.change(screen.getByLabelText('Display name'), {
            target: { value: 'Operator One' },
        });

        await waitFor(() => {
            expect(addOperatorButton).toBeEnabled();
        });
    });
});
