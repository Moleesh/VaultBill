/** @format */

import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import type { CapabilityRegistry } from '../../../capability/Capability.types';
import { CapabilityProvider } from '../../../capability/CapabilityContext';
import { RecordStoreProvider } from '../../records/RecordStoreContext';
import { SessionProvider } from '../../auth/SessionContext';
import { DashboardPage } from '../DashboardPage';

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

    it('renders the dashboard for the active operator', async () => {
        render(
            <MemoryRouter initialEntries={['/app/dashboard']}>
                <CapabilityProvider value={desktopCapabilities}>
                    <SessionProvider>
                        <RecordStoreProvider>
                            <Routes>
                                <Route path="/app/dashboard" element={<DashboardPage />} />
                            </Routes>
                        </RecordStoreProvider>
                    </SessionProvider>
                </CapabilityProvider>
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Welcome back,/u })).toBeVisible();
        });
        expect(screen.getByText('Finalized revenue')).toBeVisible();
        expect(screen.getByText('Latest records')).toBeVisible();
    });
});
