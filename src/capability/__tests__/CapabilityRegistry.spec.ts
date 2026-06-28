/** @format */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildCapabilities, isDesktopRuntime } from '../CapabilityRegistry';

describe('CapabilityRegistry', () => {
    const originalPath = `${window.location.pathname}${window.location.search}`;

    beforeEach(() => {
        window.sessionStorage.clear();
        window.history.replaceState({}, '', '/VaultBill/?runtime=desktop');
    });

    afterEach(() => {
        delete (window as Partial<Window> & { vaultBillRuntime?: unknown }).vaultBillRuntime;
        delete (window as Partial<Window> & { vaultBillDesktop?: unknown }).vaultBillDesktop;
        window.history.replaceState({}, '', originalPath);
    });

    it('keeps the desktop runtime marker after in-app navigation removes the query string', () => {
        expect(isDesktopRuntime()).toBe(true);

        window.history.replaceState({}, '', '/VaultBill/login');

        expect(buildCapabilities().isDesktop).toBe(true);
    });

    it('keeps the desktop runtime marker even when session storage becomes unavailable', () => {
        expect(isDesktopRuntime()).toBe(true);

        const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('session storage unavailable');
        });
        const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('session storage unavailable');
        });

        window.history.replaceState({}, '', '/VaultBill/login');

        expect(buildCapabilities().isDesktop).toBe(true);

        getItemSpy.mockRestore();
        setItemSpy.mockRestore();
    });
});
