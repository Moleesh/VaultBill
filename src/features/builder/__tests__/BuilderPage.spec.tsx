/** @format */

import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CapabilityRegistry } from '../../../capability/Capability.types';
import { CapabilityProvider } from '../../../capability/CapabilityContext';
import { TestQueryProvider } from '../../../test/TestQueryProvider';
import { BuilderPage } from '../BuilderPage';
import { steps } from '../BuilderPageSupport';

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

describe('builder page', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="portal-root"></div>';
        vi.restoreAllMocks();
    });

    it('renders the document library first and opens the builder from there', async () => {
        render(
            <MemoryRouter initialEntries={['/app/builder']}>
                <TestQueryProvider>
                    <CapabilityProvider value={demoCapabilities}>
                        <Routes>
                            <Route path="/app/builder" element={<BuilderPage />} />
                        </Routes>
                    </CapabilityProvider>
                </TestQueryProvider>
            </MemoryRouter>,
        );

        expect(await screen.findByRole('heading', { name: 'Available documents' })).toBeVisible();
        fireEvent.click(screen.getByRole('button', { name: /New document/u }));
        expect(await screen.findByRole('heading', { name: 'Document builder' })).toBeVisible();
    });

    it('returns to the document library after publishing a format', async () => {
        render(
            <MemoryRouter initialEntries={['/app/builder']}>
                <TestQueryProvider>
                    <CapabilityProvider value={demoCapabilities}>
                        <Routes>
                            <Route path="/app/builder" element={<BuilderPage />} />
                        </Routes>
                    </CapabilityProvider>
                </TestQueryProvider>
            </MemoryRouter>,
        );

        fireEvent.click(await screen.findByRole('button', { name: /New document/u }));
        expect(await screen.findByRole('heading', { name: 'Document builder' })).toBeVisible();

        for (let index = 0; index < steps.length - 1; index += 1) {
            fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        }

        fireEvent.click(screen.getByRole('button', { name: 'Publish format' }));

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Available documents' })).toBeVisible();
        });
    });

    it('exports the current document format as downloadable JSON', async () => {
        const objectUrl = 'blob:vaultbill-export';
        const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue(objectUrl);
        const revokeObjectUrl = vi
            .spyOn(URL, 'revokeObjectURL')
            .mockImplementation(() => undefined);
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {
                writeText: vi.fn().mockResolvedValue(undefined),
            },
        });
        const clickSpy = vi
            .spyOn(HTMLAnchorElement.prototype, 'click')
            .mockImplementation(() => undefined);

        render(
            <MemoryRouter initialEntries={['/app/builder?format=TaxInvoice']}>
                <TestQueryProvider>
                    <CapabilityProvider value={demoCapabilities}>
                        <Routes>
                            <Route path="/app/builder" element={<BuilderPage />} />
                        </Routes>
                    </CapabilityProvider>
                </TestQueryProvider>
            </MemoryRouter>,
        );

        fireEvent.click(await screen.findByRole('button', { name: 'Export JSON' }));

        expect(createObjectUrl).toHaveBeenCalledTimes(1);
        expect(clickSpy).toHaveBeenCalledTimes(1);
        const anchor = document.querySelector<HTMLAnchorElement>('a[download="TaxInvoice.json"]');
        expect(anchor).not.toBeNull();
        expect(anchor?.href).toBe(objectUrl);

        await waitFor(() => {
            expect(revokeObjectUrl).toHaveBeenCalledWith(objectUrl);
        });
    });
});
