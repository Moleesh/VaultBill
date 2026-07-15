/** @format */

import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CapabilityRegistry } from '../../capability/Capability.types';
import { CapabilityProvider } from '../../capability/CapabilityContext';
import { SessionContext } from '../../features/auth/SessionContext';
import { RecordStoreProvider } from '../../features/records/RecordStoreContext';
import { TestQueryProvider } from '../../test/TestQueryProvider';
import { createTestSession } from '../../test/TestSession';
import { AppShell } from '../AppShell';

const hasFetchCallForPath = (
    calls: readonly (readonly [string | URL | Request, ...unknown[]])[],
    path: string,
) =>
    calls.some(([input]) => {
        const url =
            typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        return url.includes(path);
    });

const expectAvailableTab = (name: string) => {
    const links = screen.getAllByRole('link', { name });
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => {
        expect(link).toBeVisible();
    });
};

const expectUnavailableTab = (name: string) => {
    expect(screen.queryAllByRole('link', { name })).toHaveLength(0);
};

const desktopCapabilities: CapabilityRegistry = {
    isDesktop: true,
    isHostedWeb: false,
    isDemoMode: false,
    runtimePlatform: 'desktop',
    canListPrinters: true,
    canSelectExactPrinter: true,
    canBrowserPrint: true,
    canDownloadPdf: true,
    canBackup: true,
    canRestore: true,
    canUsbSignaturePad: true,
    canLanServer: true,
    canSmsIntegration: true,
    canGspIntegration: true,
    hasLocalDb: true,
};

const hostedCapabilities: CapabilityRegistry = {
    isDesktop: false,
    isHostedWeb: true,
    isDemoMode: false,
    runtimePlatform: 'hosted-web',
    canListPrinters: false,
    canSelectExactPrinter: false,
    canBrowserPrint: true,
    canDownloadPdf: false,
    canBackup: true,
    canRestore: true,
    canUsbSignaturePad: false,
    canLanServer: false,
    canSmsIntegration: true,
    canGspIntegration: true,
    hasLocalDb: false,
};

const sysAdminAccount = {
    userId: 'sysadmin_1',
    username: 'sysadmin',
    displayName: 'System Administrator',
    role: 'SysAdmin',
    isActive: true,
} as const;

const userAccount = {
    userId: 'user_1',
    username: 'frontdesk',
    displayName: 'Front Desk',
    role: 'User',
    isActive: true,
} as const;

describe('app shell', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="portal-root"></div>';
        window.localStorage.clear();
        Object.defineProperty(window, 'vaultBillDesktop', {
            configurable: true,
            value: {
                closeWindow: vi.fn(),
                minimizeWindow: vi.fn(),
                reloadWindow: vi.fn(),
                getBusinessSettings: vi.fn().mockResolvedValue({
                    companyName: 'VaultBill',
                    address: 'Chennai',
                    gstin: '',
                    theme: 'teal-flow',
                    outputTarget: 'SystemPrinter',
                    preferredPrinterName: '',
                    includeDraftsInReports: false,
                }),
                saveBusinessSettings: vi.fn().mockResolvedValue(undefined),
                getHostedWebUrl: vi.fn().mockResolvedValue('http://localhost'),
                openHostedWeb: vi.fn().mockResolvedValue(undefined),
                getTrialStatus: vi.fn().mockResolvedValue({
                    isFullVersion: true,
                    isExpired: false,
                    accumulatedSeconds: 0,
                    remainingSeconds: 0,
                }),
                listRecords: vi.fn().mockResolvedValue([]),
            } as const,
        });
        Object.defineProperty(window, 'vaultBillRuntime', {
            configurable: true,
            value: 'desktop',
        });
    });

    afterEach(() => {
        delete (window as Partial<Window> & { vaultBillDesktop?: unknown }).vaultBillDesktop;
        delete (window as Partial<Window> & { vaultBillRuntime?: unknown }).vaultBillRuntime;
    });

    it('shows desktop window controls in the shell top bar', async () => {
        const fetchSpy = vi.spyOn(window, 'fetch');
        render(
            <MemoryRouter initialEntries={['/app/dashboard']}>
                <TestQueryProvider>
                    <CapabilityProvider value={desktopCapabilities}>
                        <SessionContext.Provider value={createTestSession(sysAdminAccount)}>
                            <RecordStoreProvider>
                                <Routes>
                                    <Route path="/app/*" element={<AppShell />}>
                                        <Route index element={<h1>Dashboard</h1>} />
                                    </Route>
                                </Routes>
                            </RecordStoreProvider>
                        </SessionContext.Provider>
                    </CapabilityProvider>
                </TestQueryProvider>
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(window.vaultBillDesktop?.getTrialStatus).toHaveBeenCalledTimes(1);
            expect(window.vaultBillDesktop?.getHostedWebUrl).toHaveBeenCalledTimes(1);
            expect(window.vaultBillDesktop?.getBusinessSettings).toHaveBeenCalled();
            expect(window.vaultBillDesktop?.listRecords).toHaveBeenCalledTimes(1);
        });
        expect(hasFetchCallForPath(fetchSpy.mock.calls, '/workspace/settings')).toBe(false);
        fetchSpy.mockRestore();

        expect(screen.getByRole('navigation', { name: 'Primary' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Close to tray' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Minimize to taskbar' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Refresh window' })).toBeVisible();
        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Open hosted web' })).toBeVisible();
        });
    });

    it('keeps shell window controls visible when the hosted desktop runtime marker is present', async () => {
        render(
            <MemoryRouter initialEntries={['/app/dashboard']}>
                <TestQueryProvider>
                    <CapabilityProvider value={hostedCapabilities}>
                        <SessionContext.Provider value={createTestSession(sysAdminAccount)}>
                            <RecordStoreProvider>
                                <Routes>
                                    <Route path="/app/*" element={<AppShell />}>
                                        <Route index element={<h1>Dashboard</h1>} />
                                    </Route>
                                </Routes>
                            </RecordStoreProvider>
                        </SessionContext.Provider>
                    </CapabilityProvider>
                </TestQueryProvider>
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(window.vaultBillDesktop?.getTrialStatus).toHaveBeenCalledTimes(1);
            expect(window.vaultBillDesktop?.getHostedWebUrl).toHaveBeenCalledTimes(1);
            expect(window.vaultBillDesktop?.listRecords).toHaveBeenCalledTimes(1);
        });

        expect(screen.getByRole('button', { name: 'Close to tray' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Minimize to taskbar' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Refresh window' })).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Open hosted web' })).toBeNull();
    });

    it('does not request hosted trial status after the session disappears', async () => {
        delete (window as Partial<Window> & { vaultBillDesktop?: unknown }).vaultBillDesktop;
        const fetchSpy = vi.spyOn(window, 'fetch');

        render(
            <MemoryRouter initialEntries={['/app/dashboard']}>
                <TestQueryProvider>
                    <CapabilityProvider value={hostedCapabilities}>
                        <SessionContext.Provider
                            value={{
                                accounts: [],
                                operatorContext: undefined,
                                hostedConnectionState: 'connected',
                                login: () => Promise.resolve(),
                                logout: () => undefined,
                                saveAccount: () => Promise.resolve(),
                                archiveAccount: () => Promise.resolve(),
                                resetPassword: () => Promise.resolve(),
                            }}
                        >
                            <RecordStoreProvider>
                                <Routes>
                                    <Route path="/app/*" element={<AppShell />} />
                                </Routes>
                            </RecordStoreProvider>
                        </SessionContext.Provider>
                    </CapabilityProvider>
                </TestQueryProvider>
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(hasFetchCallForPath(fetchSpy.mock.calls, '/trial/status')).toBe(false);
        });

        fetchSpy.mockRestore();
    });

    it('shows only the tabs available to SysAdmin operators', async () => {
        render(
            <MemoryRouter initialEntries={['/app/dashboard']}>
                <TestQueryProvider>
                    <CapabilityProvider value={desktopCapabilities}>
                        <SessionContext.Provider value={createTestSession(sysAdminAccount)}>
                            <RecordStoreProvider>
                                <Routes>
                                    <Route path="/app/*" element={<AppShell />}>
                                        <Route index element={<h1>Dashboard</h1>} />
                                    </Route>
                                </Routes>
                            </RecordStoreProvider>
                        </SessionContext.Provider>
                    </CapabilityProvider>
                </TestQueryProvider>
            </MemoryRouter>,
        );

        await screen.findAllByRole('link', { name: 'Dashboard' });
        expectAvailableTab('Dashboard');
        expectAvailableTab('Records');
        expectAvailableTab('Reports');
        expectAvailableTab('Builder');
        expectAvailableTab('Settings');
    });

    it('shows only the tabs available to User operators', async () => {
        render(
            <MemoryRouter initialEntries={['/app/records']}>
                <TestQueryProvider>
                    <CapabilityProvider value={desktopCapabilities}>
                        <SessionContext.Provider value={createTestSession(userAccount)}>
                            <RecordStoreProvider>
                                <Routes>
                                    <Route path="/app/*" element={<AppShell />}>
                                        <Route index element={<h1>Records</h1>} />
                                    </Route>
                                </Routes>
                            </RecordStoreProvider>
                        </SessionContext.Provider>
                    </CapabilityProvider>
                </TestQueryProvider>
            </MemoryRouter>,
        );

        await screen.findAllByRole('link', { name: 'Records' });
        expectAvailableTab('Records');
        expectAvailableTab('Reports');
        expectUnavailableTab('Dashboard');
        expectUnavailableTab('Builder');
        expectUnavailableTab('Settings');
    });
});
