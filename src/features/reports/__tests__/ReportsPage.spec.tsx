/** @format */

import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import type { CapabilityRegistry } from '../../../capability/Capability.types';
import { CapabilityProvider } from '../../../capability/CapabilityContext';
import { SessionProvider } from '../../auth/SessionContext';
import { RecordStoreProvider } from '../../records/RecordStoreContext';
import { ReportsPage } from '../ReportsPage';

const demoCapabilities: CapabilityRegistry = {
    isDesktop: false,
    isHostedWeb: false,
    isDemoMode: true,
    canListPrinters: false,
    canSelectExactPrinter: false,
    canBrowserPrint: true,
    canDownloadPdf: true,
    canBackup: false,
    canRestore: false,
    canUsbSignaturePad: false,
    canLanServer: false,
    canSmsIntegration: false,
    canGspIntegration: false,
    hasLocalDb: false,
};

describe('reports page', () => {
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

    it('renders the report workspace', async () => {
        render(
            <MemoryRouter initialEntries={['/app/reports']}>
                <CapabilityProvider value={demoCapabilities}>
                    <SessionProvider>
                        <RecordStoreProvider>
                            <Routes>
                                <Route path="/app/reports" element={<ReportsPage />} />
                            </Routes>
                        </RecordStoreProvider>
                    </SessionProvider>
                </CapabilityProvider>
            </MemoryRouter>,
        );

        expect(await screen.findByRole('heading', { name: 'Business reports' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Print report' })).toBeVisible();
    });
});
