/** @format */

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CapabilityRegistry } from '../../../capability/Capability.types';
import { CapabilityProvider } from '../../../capability/CapabilityContext';
import { SetupPage } from '../SetupPage';

const webCapabilities: CapabilityRegistry = {
    isDesktop: false,
    isHostedWeb: true,
    isDemoMode: false,
    canListPrinters: false,
    canSelectExactPrinter: false,
    canBrowserPrint: true,
    canDownloadPdf: false,
    canBackup: true,
    canRestore: true,
    canUsbSignaturePad: false,
    canLanServer: false,
    canSmsIntegration: true,
    canGspIntegration: true,
    hasLocalDb: false,
};

describe('SetupPage desktop chrome', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="portal-root"></div>';
        window.localStorage.clear();
        Object.defineProperty(window, 'vaultBillRuntime', {
            configurable: true,
            value: 'desktop',
        });
        Object.defineProperty(window, 'vaultBillDesktop', {
            configurable: true,
            value: {
                closeWindow: vi.fn().mockResolvedValue(undefined),
                minimizeWindow: vi.fn().mockResolvedValue(undefined),
            } as const,
        });
    });

    afterEach(() => {
        delete (window as Partial<Window> & { vaultBillDesktop?: unknown }).vaultBillDesktop;
        delete (window as Partial<Window> & { vaultBillRuntime?: unknown }).vaultBillRuntime;
    });

    it('shows and wires desktop controls when the desktop runtime marker is present', () => {
        render(
            <MemoryRouter initialEntries={['/setup']}>
                <CapabilityProvider value={webCapabilities}>
                    <SetupPage />
                </CapabilityProvider>
            </MemoryRouter>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Minimize to taskbar' }));
        fireEvent.click(screen.getByRole('button', { name: 'Close to tray' }));

        expect(window.vaultBillDesktop?.minimizeWindow).toHaveBeenCalledTimes(1);
        expect(window.vaultBillDesktop?.closeWindow).toHaveBeenCalledTimes(1);
    });
});
