/** @format */

import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import type { CapabilityRegistry } from '../../../capability/Capability.types';
import { CapabilityProvider } from '../../../capability/CapabilityContext';
import { SessionContext } from '../../auth/SessionContext';
import { SysAdminDashboard } from '../SysAdminDashboard';
import { createTestSession } from '../../../test/TestSession';

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

const sysAdminAccount = {
    userId: 'sysadmin_1',
    username: 'sysadmin',
    displayName: 'System Administrator',
    role: 'SysAdmin',
    isActive: true,
} as const;

describe('SysAdmin dashboard', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="portal-root"></div>';
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

    it('shows the operational summary and trial countdown', async () => {
        render(
            <MemoryRouter>
                <CapabilityProvider value={desktopCapabilities}>
                    <SessionContext.Provider value={createTestSession(sysAdminAccount)}>
                        <SysAdminDashboard />
                    </SessionContext.Provider>
                </CapabilityProvider>
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText('Publishing health')).toBeVisible();
        });
        expect(screen.getByText('Trial countdown')).toBeVisible();
        expect(screen.getByText('Document mix')).toBeVisible();
        expect(screen.getByText('People and backup')).toBeVisible();
        expect(screen.getByText('Users created')).toBeVisible();
        expect(screen.getByText('active users')).toBeVisible();
        expect(screen.getByText('Total records')).toBeVisible();
        expect(
            screen.getByText(
                '1 format published, 0 formats need attention, 1 format marked default.',
            ),
        ).toBeVisible();
    });
});
