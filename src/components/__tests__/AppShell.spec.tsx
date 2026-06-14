/** @format */

import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CapabilityRegistry } from '../../capability/Capability.types';
import { CapabilityProvider } from '../../capability/CapabilityContext';
import { AppShell } from '../AppShell';
import { RecordStoreProvider } from '../../features/records/RecordStoreContext';
import { SessionProvider } from '../../features/auth/SessionContext';

const desktopCapabilities: CapabilityRegistry = {
    isDesktop: true,
    isLanBrowser: false,
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

describe('app shell', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="portal-root"></div>';
        window.localStorage.clear();
        window.localStorage.setItem('vaultbill.operator', 'sysadmin_1');
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
        Object.defineProperty(window, 'vaultBillDesktop', {
            configurable: true,
            value: {
                closeWindow: vi.fn(),
                minimizeWindow: vi.fn(),
                getTrialStatus: vi.fn().mockResolvedValue({
                    isFullVersion: true,
                    isExpired: false,
                    accumulatedSeconds: 0,
                    remainingSeconds: 0,
                }),
                getCredentialStatus: vi.fn().mockResolvedValue({
                    sysAdminUsesDefaultPassword: false,
                    backupUsesDefaultPassword: false,
                }),
                listAccounts: vi.fn().mockResolvedValue([
                    {
                        userId: 'sysadmin_1',
                        username: 'sysadmin',
                        displayName: 'System Administrator',
                        role: 'SysAdmin',
                        isActive: true,
                    },
                ]),
                saveAccount: vi.fn(),
                archiveAccount: vi.fn(),
                resetPassword: vi.fn(),
                activateLicense: vi.fn(),
                saveBuilderPackage: vi.fn(),
                saveBusinessSettings: vi.fn(),
                saveIntegrationSettings: vi.fn(),
                createBackup: vi.fn(),
                restoreBackup: vi.fn(),
                resetApplicationData: vi.fn(),
                configureLocalApi: vi.fn(),
                listPrinters: vi.fn().mockResolvedValue([]),
                listRecords: vi.fn().mockResolvedValue([]),
            } as const,
        });
    });

    afterEach(() => {
        delete (window as Partial<Window> & { vaultBillDesktop?: unknown }).vaultBillDesktop;
    });

    it('shows desktop window controls in the shell top bar', () => {
        render(
            <MemoryRouter initialEntries={['/app/dashboard']}>
                <CapabilityProvider value={desktopCapabilities}>
                    <SessionProvider>
                        <RecordStoreProvider>
                            <Routes>
                                <Route path="/app/*" element={<AppShell />}>
                                    <Route index element={<h1>Dashboard</h1>} />
                                </Route>
                            </Routes>
                        </RecordStoreProvider>
                    </SessionProvider>
                </CapabilityProvider>
            </MemoryRouter>,
        );

        expect(screen.getByRole('navigation', { name: 'Primary' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Close window' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Minimize window' })).toBeVisible();
    });
});
