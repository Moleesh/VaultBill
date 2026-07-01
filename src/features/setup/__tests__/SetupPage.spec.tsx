/** @format */
/* eslint-disable max-lines */

import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CapabilityRegistry } from '../../../capability/Capability.types';
import { CapabilityProvider } from '../../../capability/CapabilityContext';
import { SetupPage } from '../SetupPage';

const createDeferred = <T,>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((nextResolve) => {
        resolve = nextResolve;
    });
    return { promise, resolve };
};

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
                getBusinessSettings: vi.fn().mockResolvedValue({
                    companyName: '',
                    address: '',
                    theme: 'teal-flow',
                }),
                listAccounts: vi.fn().mockResolvedValue([]),
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

    it('prepopulates existing workspace and admin values when setup is reopened', async () => {
        const desktopBridge = {
            closeWindow: vi.fn().mockResolvedValue(undefined),
            getBusinessSettings: vi.fn().mockResolvedValue({
                companyName: 'Aster Works',
                address: '12 Market Road',
                theme: 'teal-flow',
            }),
            listAccounts: vi.fn().mockResolvedValue([
                {
                    userId: 'admin_1',
                    username: 'owner',
                    displayName: 'Owner Admin',
                    role: 'Admin',
                    isActive: true,
                },
            ]),
            minimizeWindow: vi.fn().mockResolvedValue(undefined),
        } as const;
        Object.defineProperty(window, 'vaultBillDesktop', {
            configurable: true,
            value: desktopBridge,
        });

        render(
            <MemoryRouter initialEntries={['/setup']}>
                <CapabilityProvider value={webCapabilities}>
                    <SetupPage />
                </CapabilityProvider>
            </MemoryRouter>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

        expect(await screen.findByDisplayValue('Aster Works')).toBeVisible();
        expect(screen.getByDisplayValue('12 Market Road')).toBeVisible();
        expect(desktopBridge.getBusinessSettings).toHaveBeenCalled();
        expect(desktopBridge.listAccounts).toHaveBeenCalled();
    });

    it('shows that the current admin password is retained unless replaced', async () => {
        const desktopBridge = {
            closeWindow: vi.fn().mockResolvedValue(undefined),
            getBusinessSettings: vi.fn().mockResolvedValue({
                companyName: 'Aster Works',
                address: '12 Market Road',
                theme: 'teal-flow',
            }),
            listAccounts: vi.fn().mockResolvedValue([
                {
                    userId: 'admin_1',
                    username: 'owner',
                    displayName: 'Owner Admin',
                    role: 'Admin',
                    isActive: true,
                    passwordConfigured: true,
                },
            ]),
            minimizeWindow: vi.fn().mockResolvedValue(undefined),
        } as const;
        Object.defineProperty(window, 'vaultBillDesktop', {
            configurable: true,
            value: desktopBridge,
        });

        render(
            <MemoryRouter initialEntries={['/setup']}>
                <CapabilityProvider value={webCapabilities}>
                    <SetupPage />
                </CapabilityProvider>
            </MemoryRouter>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Continue' }));

        expect(
            await screen.findByText('Current password is kept unless you enter a new one here.'),
        ).toBeVisible();
        expect(
            screen.getByPlaceholderText('Enter a new password only if you want to replace it'),
        ).toBeVisible();
    });

    it('continues on the first click right after entering setup details', async () => {
        render(
            <MemoryRouter initialEntries={['/setup']}>
                <CapabilityProvider value={webCapabilities}>
                    <SetupPage />
                </CapabilityProvider>
            </MemoryRouter>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

        fireEvent.change(
            await screen.findByPlaceholderText('Business name shown across the workspace'),
            {
                target: { value: 'Sample Co' },
            },
        );
        fireEvent.change(
            screen.getByPlaceholderText('Primary business address for documents and reports'),
            {
                target: { value: '42 Ledger Street' },
            },
        );
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

        await act(async () => {
            await new Promise((resolve) => {
                window.requestAnimationFrame(() => {
                    resolve(undefined);
                });
            });
        });

        expect(
            await screen.findByRole('heading', {
                level: 2,
                name: 'Admin Access',
            }),
        ).toBeVisible();
    });

    it('keeps a manual theme pick even if setup hydration finishes later', async () => {
        const businessSettingsDeferred = createDeferred<{
            companyName: string;
            address: string;
            theme: string;
        }>();
        const accountsDeferred = createDeferred<
            {
                userId: string;
                username: string;
                displayName: string;
                role: 'Admin';
                isActive: boolean;
            }[]
        >();
        const desktopBridge = {
            closeWindow: vi.fn().mockResolvedValue(undefined),
            getBusinessSettings: vi.fn().mockReturnValue(businessSettingsDeferred.promise),
            listAccounts: vi.fn().mockReturnValue(accountsDeferred.promise),
            minimizeWindow: vi.fn().mockResolvedValue(undefined),
        } as const;
        Object.defineProperty(window, 'vaultBillDesktop', {
            configurable: true,
            value: desktopBridge,
        });

        render(
            <MemoryRouter initialEntries={['/setup']}>
                <CapabilityProvider value={webCapabilities}>
                    <SetupPage />
                </CapabilityProvider>
            </MemoryRouter>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        fireEvent.change(
            await screen.findByPlaceholderText('Business name shown across the workspace'),
            {
                target: { value: 'Sample Co' },
            },
        );
        fireEvent.change(
            screen.getByPlaceholderText('Primary business address for documents and reports'),
            {
                target: { value: '42 Ledger Street' },
            },
        );
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

        await screen.findByRole('heading', {
            level: 2,
            name: 'Admin Access',
        });

        fireEvent.click(screen.getByRole('radio', { name: 'Indigo Mint' }));
        expect(document.documentElement.dataset.theme).toBe('indigo-mint');

        await act(async () => {
            businessSettingsDeferred.resolve({
                companyName: 'Late Business',
                address: 'Late Address',
                theme: 'teal-flow',
            });
            accountsDeferred.resolve([]);
            await Promise.resolve();
        });

        expect(document.documentElement.dataset.theme).toBe('indigo-mint');
    });
});
