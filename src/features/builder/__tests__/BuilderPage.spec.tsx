/** @format */

import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import type { CapabilityRegistry } from '../../../capability/Capability.types';
import { CapabilityProvider } from '../../../capability/CapabilityContext';
import { BuilderPage } from '../BuilderPage';

const demoCapabilities: CapabilityRegistry = {
    isDesktop: false,
    isLanBrowser: false,
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

    it('renders the document-format builder workspace', async () => {
        render(
            <MemoryRouter initialEntries={['/app/builder']}>
                <CapabilityProvider value={demoCapabilities}>
                    <Routes>
                        <Route path="/app/builder" element={<BuilderPage />} />
                    </Routes>
                </CapabilityProvider>
            </MemoryRouter>,
        );

        expect(await screen.findByRole('heading', { name: 'Document builder' })).toBeVisible();
        expect(screen.getByRole('heading', { name: 'Document library' })).toBeVisible();
        expect(screen.getByText('Field Preview')).toBeVisible();
        expect(screen.getByText('Print Preview')).toBeVisible();
    });
});
