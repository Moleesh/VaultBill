/** @format */

import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import type { CapabilityRegistry } from '../../../capability/Capability.types';
import { CapabilityProvider } from '../../../capability/CapabilityContext';
import { TestQueryProvider } from '../../../test/TestQueryProvider';
import { SessionProvider } from '../../auth/SessionContext';
import { RecordStoreProvider } from '../../records/RecordStoreContext';
import { ReportsPage } from '../ReportsPage';

const demoCapabilities: CapabilityRegistry = {
    isDesktop: false,
    isHostedWeb: false,
    isDemoMode: true,
    runtimePlatform: 'demo',
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
                <TestQueryProvider>
                    <CapabilityProvider value={demoCapabilities}>
                        <SessionProvider>
                            <RecordStoreProvider>
                                <Routes>
                                    <Route path="/app/reports" element={<ReportsPage />} />
                                </Routes>
                            </RecordStoreProvider>
                        </SessionProvider>
                    </CapabilityProvider>
                </TestQueryProvider>
            </MemoryRouter>,
        );

        expect(
            await screen.findByText(
                'Choose a format, run a saved report, or build one with reusable filters.',
            ),
        ).toBeVisible();
        expect(screen.getByRole('button', { name: 'Print report' })).toBeVisible();
    });

    it('selects built-in saved reports and opens the report wizard', async () => {
        render(
            <MemoryRouter initialEntries={['/app/reports']}>
                <TestQueryProvider>
                    <CapabilityProvider value={demoCapabilities}>
                        <SessionProvider>
                            <RecordStoreProvider>
                                <Routes>
                                    <Route path="/app/reports" element={<ReportsPage />} />
                                </Routes>
                            </RecordStoreProvider>
                        </SessionProvider>
                    </CapabilityProvider>
                </TestQueryProvider>
            </MemoryRouter>,
        );

        expect(
            await screen.findByText(
                'Choose a format, run a saved report, or build one with reusable filters.',
            ),
        ).toBeVisible();
        fireEvent.click(screen.getByRole('button', { name: 'Saved report Choose saved report' }));
        fireEvent.click(
            await screen.findByRole('option', { name: /Today's report - Sales register/u }),
        );

        expect(screen.getByText('Built-in report')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Set as my default' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Duplicate' })).toBeEnabled();
        expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Create report' }));

        expect(screen.getByRole('heading', { name: 'Create report' })).toBeVisible();
        expect(screen.getByRole('heading', { name: 'Display fields' })).toBeVisible();
        expect(screen.getByRole('heading', { name: 'Sorting' })).toBeVisible();
        expect(screen.getByRole('heading', { name: 'Filters' })).toBeVisible();
    });
});
