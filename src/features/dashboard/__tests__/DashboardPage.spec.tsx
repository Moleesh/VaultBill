/** @format */

import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import type { CapabilityRegistry } from '../../../capability/Capability.types';
import { CapabilityProvider } from '../../../capability/CapabilityContext';
import { RecordStoreProvider } from '../../records/RecordStoreContext';
import { SessionProvider } from '../../auth/SessionContext';
import { DashboardPage } from '../DashboardPage';

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

describe('dashboard page', () => {
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
    });

    it('renders the dashboard greeting for the active operator', async () => {
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

        expect(
            await screen.findByRole('heading', { name: 'Configuration control centre' }),
        ).toBeVisible();
        expect(screen.getByRole('link', { name: 'Create format' })).toBeVisible();
    });
});
