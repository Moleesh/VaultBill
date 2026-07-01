/** @format */

import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CapabilityRegistry } from '../../../capability/Capability.types';
import { CapabilityProvider } from '../../../capability/CapabilityContext';
import { TestQueryProvider } from '../../../test/TestQueryProvider';
import { RecordStoreProvider } from '../../records/RecordStoreContext';
import { SessionContext } from '../../auth/SessionContext';
import { SessionProvider } from '../../auth/SessionContext';
import { DashboardPage } from '../DashboardPage';

const hasFetchCallForAnyPath = (
    calls: readonly (readonly [string | URL | Request, ...unknown[]])[],
    paths: readonly string[],
) =>
    calls.some(([input]) => {
        const url =
            typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        return paths.some((path) => url.includes(path));
    });

const desktopCapabilities: CapabilityRegistry = {
    isDesktop: true,
    isHostedWeb: false,
    isDemoMode: false,
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

describe('dashboard page', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="portal-root"></div>';
        window.localStorage.clear();
        window.localStorage.setItem('vaultbill.setup.complete', 'true');
        window.localStorage.setItem('vaultbill.operator', 'admin_1');
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
        Object.defineProperty(window, 'vaultBillDesktop', {
            configurable: true,
            value: {
                listBuilderInventory: () =>
                    Promise.resolve([
                        {
                            formatId: 'gst-invoice',
                            formatName: 'GST Invoice',
                            isDefault: true,
                            updatedAt: '2026-06-11T12:00:00.000Z',
                            templateName: 'default-template.html',
                            assetCount: 1,
                            isValid: true,
                        },
                    ]),
                listRecords: () =>
                    Promise.resolve([
                        { status: 'Draft' },
                        { status: 'Finalized' },
                        { status: 'Cancelled' },
                    ]),
                listAccounts: () => Promise.resolve([{ isActive: true }, { isActive: false }]),
                getBackupStatus: () =>
                    Promise.resolve({ lastBackupAt: '2026-06-12T08:30:00.000Z' }),
                getTrialStatus: () =>
                    Promise.resolve({
                        isFullVersion: false,
                        isExpired: false,
                        remainingSeconds: 3600,
                    }),
            },
        });
    });

    afterEach(() => {
        delete (window as Partial<Window> & { vaultBillDesktop?: unknown }).vaultBillDesktop;
    });

    it('renders the dashboard for the active operator', async () => {
        render(
            <MemoryRouter initialEntries={['/app/dashboard']}>
                <TestQueryProvider>
                    <CapabilityProvider value={desktopCapabilities}>
                        <SessionProvider>
                            <RecordStoreProvider>
                                <Routes>
                                    <Route path="/app/dashboard" element={<DashboardPage />} />
                                </Routes>
                            </RecordStoreProvider>
                        </SessionProvider>
                    </CapabilityProvider>
                </TestQueryProvider>
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Welcome back,/u })).toBeVisible();
        });
        expect(screen.getByText('Finalized revenue')).toBeVisible();
        expect(screen.getByText('Latest records')).toBeVisible();
    });

    it('does not request hosted summary endpoints without an active hosted session', async () => {
        delete (window as Partial<Window> & { vaultBillDesktop?: unknown }).vaultBillDesktop;
        const fetchSpy = vi.spyOn(window, 'fetch');

        render(
            <MemoryRouter initialEntries={['/app/dashboard']}>
                <CapabilityProvider
                    value={{
                        ...desktopCapabilities,
                        isDesktop: false,
                        isHostedWeb: true,
                        hasLocalDb: false,
                    }}
                >
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
                                <Route path="/app/dashboard" element={<DashboardPage />} />
                            </Routes>
                        </RecordStoreProvider>
                    </SessionContext.Provider>
                </CapabilityProvider>
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(
                hasFetchCallForAnyPath(fetchSpy.mock.calls, [
                    '/builder/inventory',
                    '/records',
                    '/backup/status',
                    '/trial/status',
                ]),
            ).toBe(false);
        });

        fetchSpy.mockRestore();
    });
});
