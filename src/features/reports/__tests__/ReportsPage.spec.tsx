/** @format */

import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import type { CapabilityRegistry } from '../../../capability/Capability.types';
import { CapabilityProvider } from '../../../capability/CapabilityContext';
import { TestQueryProvider } from '../../../test/TestQueryProvider';
import { createTestSession } from '../../../test/TestSession';
import { SessionContext } from '../../auth/SessionContext';
import { RecordStoreProvider } from '../../records/RecordStoreContext';
import { ReportsPage } from '../ReportsPage';
import { createSavedReportDraft, saveCustomSavedReport } from '../SavedReportsSupport';

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
                        <SessionContext.Provider
                            value={createTestSession({
                                userId: 'sysadmin_1',
                                username: 'sysadmin',
                                displayName: 'System Administrator',
                                role: 'SysAdmin',
                                isActive: true,
                            })}
                        >
                            <RecordStoreProvider>
                                <Routes>
                                    <Route path="/app/reports" element={<ReportsPage />} />
                                </Routes>
                            </RecordStoreProvider>
                        </SessionContext.Provider>
                    </CapabilityProvider>
                </TestQueryProvider>
            </MemoryRouter>,
        );

        expect(await screen.findByRole('heading', { name: 'Sales register' })).toBeVisible();
        expect(screen.getByText('Reports workspace')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Print report' })).toBeVisible();
    });

    it('selects built-in saved reports and opens the report wizard', async () => {
        render(
            <MemoryRouter initialEntries={['/app/reports']}>
                <TestQueryProvider>
                    <CapabilityProvider value={demoCapabilities}>
                        <SessionContext.Provider
                            value={createTestSession({
                                userId: 'sysadmin_1',
                                username: 'sysadmin',
                                displayName: 'System Administrator',
                                role: 'SysAdmin',
                                isActive: true,
                            })}
                        >
                            <RecordStoreProvider>
                                <Routes>
                                    <Route path="/app/reports" element={<ReportsPage />} />
                                </Routes>
                            </RecordStoreProvider>
                        </SessionContext.Provider>
                    </CapabilityProvider>
                </TestQueryProvider>
            </MemoryRouter>,
        );

        expect(await screen.findByRole('heading', { name: 'Sales register' })).toBeVisible();
        fireEvent.click(screen.getByRole('button', { name: 'Saved report Choose saved report' }));
        fireEvent.click(
            await screen.findByRole('option', { name: /Today's report.*Sales register/u }),
        );

        expect(screen.getByText("Active view: Today's report")).toBeVisible();

        fireEvent.click(screen.getByRole('button', { name: /Saved report /u }));
        fireEvent.click(screen.getByRole('button', { name: 'Create report' }));

        expect(screen.getByRole('heading', { name: 'Create report' })).toBeVisible();
        expect(screen.getByRole('heading', { name: 'Display fields' })).toBeVisible();
        expect(screen.getByRole('heading', { name: 'Sorting' })).toBeVisible();
        expect(screen.getByRole('heading', { name: 'Filters' })).toBeVisible();
    });

    it('limits saved reports to the selected format', async () => {
        render(
            <MemoryRouter initialEntries={['/app/reports']}>
                <TestQueryProvider>
                    <CapabilityProvider value={demoCapabilities}>
                        <SessionContext.Provider
                            value={createTestSession({
                                userId: 'sysadmin_1',
                                username: 'sysadmin',
                                displayName: 'System Administrator',
                                role: 'SysAdmin',
                                isActive: true,
                            })}
                        >
                            <RecordStoreProvider>
                                <Routes>
                                    <Route path="/app/reports" element={<ReportsPage />} />
                                </Routes>
                            </RecordStoreProvider>
                        </SessionContext.Provider>
                    </CapabilityProvider>
                </TestQueryProvider>
            </MemoryRouter>,
        );

        expect(await screen.findByRole('heading', { name: 'Sales register' })).toBeVisible();

        fireEvent.click(screen.getByRole('button', { name: 'Saved report Choose saved report' }));

        expect(
            await screen.findByRole('option', { name: /Today's report.*Sales register/u }),
        ).toBeVisible();
        expect(
            screen.queryByRole('option', { name: /Today's report.*Tax summary/u }),
        ).not.toBeInTheDocument();
    });

    it('shows inline edit and delete actions for custom saved reports', async () => {
        saveCustomSavedReport(
            createSavedReportDraft({
                ownerUserId: 'sysadmin_1',
                name: 'Month end snapshot',
                formatId: 'sales-register',
                displayFields: ['customerName', 'grandTotal'],
                filters: [],
                preset: 'All',
                sorts: ['updatedAt:desc'],
                status: 'All',
            }),
        );

        render(
            <MemoryRouter initialEntries={['/app/reports']}>
                <TestQueryProvider>
                    <CapabilityProvider value={demoCapabilities}>
                        <SessionContext.Provider
                            value={createTestSession({
                                userId: 'sysadmin_1',
                                username: 'sysadmin',
                                displayName: 'System Administrator',
                                role: 'SysAdmin',
                                isActive: true,
                            })}
                        >
                            <RecordStoreProvider>
                                <Routes>
                                    <Route path="/app/reports" element={<ReportsPage />} />
                                </Routes>
                            </RecordStoreProvider>
                        </SessionContext.Provider>
                    </CapabilityProvider>
                </TestQueryProvider>
            </MemoryRouter>,
        );

        expect(await screen.findByRole('heading', { name: 'Sales register' })).toBeVisible();

        fireEvent.click(screen.getByRole('button', { name: 'Saved report Choose saved report' }));

        expect(screen.getByRole('button', { name: 'Edit Month end snapshot' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Delete Month end snapshot' })).toBeVisible();

        expect(screen.getByRole('button', { name: 'Edit Month end snapshot' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Delete Month end snapshot' })).toBeEnabled();
    });
});
