/** @format */

import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import type { CapabilityRegistry } from '../../../capability/Capability.types';
import { CapabilityProvider } from '../../../capability/CapabilityContext';
import { TestQueryProvider } from '../../../test/TestQueryProvider';
import { BuilderPage } from '../BuilderPage';

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

describe('builder page', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="portal-root"></div>';
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

        expect(await screen.findByRole('heading', { name: 'Document library' })).toBeVisible();
        fireEvent.click(screen.getByRole('button', { name: /New document/u }));
        expect(await screen.findByRole('heading', { name: 'Document builder' })).toBeVisible();
    });
});
