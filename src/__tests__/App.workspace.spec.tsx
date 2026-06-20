/** @format */

import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';

import { CapabilityProvider } from '../capability/CapabilityContext';
import type { CapabilityRegistry } from '../capability/Capability.types';
import { SearchableDropdown } from '../components/SearchableDropdown/SearchableDropdown';
import { SessionContext } from '../features/auth/SessionContext';
import { demoAccount } from '../features/auth/SessionSupport';
import { BuilderPage } from '../features/builder/BuilderPage';
import { RecordsPage } from '../features/records/RecordsPage';
import { RecordStoreProvider } from '../features/records/RecordStoreContext';
import { ReportsPage } from '../features/reports/ReportsPage';
import { createTestSession } from '../test/TestSession';

const webCapabilities: CapabilityRegistry = {
    isDesktop: false,
    isHostedWeb: false,
    isDemoMode: true,
    canListPrinters: false,
    canSelectExactPrinter: false,
    canBrowserPrint: true,
    canDownloadPdf: false,
    canBackup: false,
    canRestore: false,
    canUsbSignaturePad: false,
    canLanServer: false,
    canSmsIntegration: false,
    canGspIntegration: false,
    hasLocalDb: false,
};

const renderPage = (children: ReactNode, capabilities = webCapabilities) =>
    render(
        <MemoryRouter>
            <CapabilityProvider value={capabilities}>
                <SessionContext.Provider value={createTestSession(demoAccount)}>
                    <RecordStoreProvider>{children}</RecordStoreProvider>
                </SessionContext.Provider>
            </CapabilityProvider>
        </MemoryRouter>,
    );

describe('product UI', () => {
    const clickAction = (name: RegExp | string) => {
        act(() => {
            fireEvent.click(screen.getByRole('button', { name }));
        });
    };

    beforeEach(() => {
        document.body.innerHTML = '<div id="portal-root"></div>';
        window.localStorage.clear();
    });

    it('moves a new record into the saved Draft state', async () => {
        renderPage(<RecordsPage />);

        fireEvent.change(screen.getByPlaceholderText('Business or customer name'), {
            target: { value: 'Aster Works' },
        });
        fireEvent.click(screen.getByRole('button', { name: /^Draft Control\+S$/u }));

        expect(
            await screen.findByText('Draft saved. Draft Print and Finalize are now available.'),
        ).toBeVisible();
        expect(screen.getByRole('button', { name: /Finalize/u })).toBeEnabled();
    });

    it('shows demo report data and the builder steps', async () => {
        renderPage(
            <>
                <ReportsPage />
                <BuilderPage />
            </>,
        );

        expect((await screen.findAllByText('Aster Works')).length).toBeGreaterThan(0);
        clickAction(/Edit current/u);
        expect(await screen.findByRole('heading', { name: 'Document builder' })).toBeVisible();
        clickAction(/^Print$/u);
        expect(screen.getByRole('heading', { name: 'Print' })).toBeVisible();
        expect(screen.getByText(/Upload or choose a reusable template/u)).toBeVisible();
        expect(screen.getByRole('heading', { name: 'Shared print HTML' })).toBeVisible();
        expect(screen.getByText('{{Asset.CompanyLogo}}')).toBeVisible();
    });

    it('shows the document name field without exposing the internal format ID', async () => {
        renderPage(<BuilderPage />);

        clickAction(/Edit current/u);
        expect(await screen.findByRole('heading', { name: 'Document builder' })).toBeVisible();
        expect(screen.getByRole('heading', { name: 'Format' })).toBeVisible();
        expect(screen.getByText('Document name')).toBeVisible();
        expect(screen.queryByText('Format ID')).not.toBeInTheDocument();
    });

    it('hides sample value editing in the field drawer', async () => {
        render(
            <MemoryRouter initialEntries={['/app/builder?step=fields']}>
                <CapabilityProvider value={webCapabilities}>
                    <SessionContext.Provider value={createTestSession(demoAccount)}>
                        <RecordStoreProvider>
                            <BuilderPage />
                        </RecordStoreProvider>
                    </SessionContext.Provider>
                </CapabilityProvider>
            </MemoryRouter>,
        );

        clickAction(/Edit current/u);
        expect(await screen.findByRole('heading', { name: 'Document builder' })).toBeVisible();
        clickAction(/^Fields$/u);
        clickAction(/^Edit Invoice Date$/u);

        expect(screen.getByRole('dialog', { name: /Edit Invoice Date/u })).toBeVisible();
        expect(screen.getAllByText('Edit Invoice Date').length).toBeGreaterThan(1);
        expect(screen.queryByText('Sample value')).not.toBeInTheDocument();
    });

    it('shows field and print previews in the builder preview steps', async () => {
        renderPage(<BuilderPage />);

        clickAction(/Edit current/u);
        expect(await screen.findByRole('heading', { name: 'Document builder' })).toBeVisible();
        clickAction(/Field Preview/u);
        expect(screen.getByRole('heading', { name: /Field preview/u })).toBeVisible();
        expect(screen.getByLabelText('Invoice Date')).toBeVisible();
        expect(screen.getAllByText('Item Name').length).toBeGreaterThan(0);

        clickAction(/Print Preview/u);
        expect(screen.getByRole('heading', { name: /Print preview/u })).toBeVisible();
    });

    it('can open the print preview step directly from the route', async () => {
        render(
            <MemoryRouter initialEntries={['/app/builder?step=preview']}>
                <CapabilityProvider value={webCapabilities}>
                    <SessionContext.Provider value={createTestSession(demoAccount)}>
                        <RecordStoreProvider>
                            <BuilderPage />
                        </RecordStoreProvider>
                    </SessionContext.Provider>
                </CapabilityProvider>
            </MemoryRouter>,
        );

        clickAction(/Edit current/u);
        expect(await screen.findByRole('heading', { name: 'Document builder' })).toBeVisible();
        expect(screen.getByRole('heading', { name: /Print preview/u })).toBeVisible();
    });

    it('filters long dropdown options through its portal', () => {
        const options = Array.from({ length: 9 }, (_, index) => ({
            value: `state-${String(index)}`,
            label: `State ${String(index)}`,
            keywords: [`region-${String(index)}`],
        }));

        renderPage(
            <SearchableDropdown
                label="State"
                onChange={() => undefined}
                options={options}
                value="state-0"
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: /State State 0/u }));
        fireEvent.change(screen.getByPlaceholderText('Search options'), {
            target: { value: 'region-8' },
        });
        expect(screen.getByRole('option', { name: 'State 8' })).toBeVisible();
        expect(screen.queryByRole('option', { name: 'State 1' })).not.toBeInTheDocument();
    });
});
