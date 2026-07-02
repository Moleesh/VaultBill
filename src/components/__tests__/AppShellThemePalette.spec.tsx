/** @format */

import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CapabilityRegistry } from '../../capability/Capability.types';
import { CapabilityProvider } from '../../capability/CapabilityContext';
import { SessionContext } from '../../features/auth/SessionContext';
import { RecordStoreProvider } from '../../features/records/RecordStoreContext';
import { TestQueryProvider } from '../../test/TestQueryProvider';
import { createTestSession } from '../../test/TestSession';
import { AppShell } from '../AppShell';

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

describe('app shell theme palette', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="portal-root"></div>';
        window.localStorage.clear();
        Object.defineProperty(window, 'vaultBillDesktop', {
            configurable: true,
            value: {
                closeWindow: vi.fn(),
                minimizeWindow: vi.fn(),
                reloadWindow: vi.fn(),
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

    it('applies a selected sidebar theme palette option instead of closing early', async () => {
        const { container } = render(
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
        });

        const sidebarThemeTrigger = container.querySelector(
            '.app-shell-operator-actions .theme-palette-trigger',
        );
        expect(sidebarThemeTrigger).not.toBeNull();

        fireEvent.click(sidebarThemeTrigger as HTMLButtonElement);

        await waitFor(() => {
            expect(screen.getByRole('dialog', { name: 'Theme palette' })).toBeVisible();
        });

        fireEvent.click(screen.getByRole('button', { name: 'Slate Pro' }));

        await waitFor(() => {
            expect(document.documentElement.dataset.theme).toBe('slate-pro');
        });
    });
});
