/** @format */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    androidPairingStorageKey,
    defaultAndroidPairingSettings,
    readAndroidPairingSettings,
    saveAndroidPairingSettings,
    scanAndroidPairingHosts,
} from '../AndroidPairing';

describe('AndroidPairing', () => {
    beforeEach(() => {
        window.localStorage.clear();
        vi.restoreAllMocks();
    });

    it('returns defaults when no pairing has been stored', () => {
        expect(readAndroidPairingSettings()).toEqual(defaultAndroidPairingSettings);
    });

    it('normalizes the host target when settings are saved and read back', () => {
        saveAndroidPairingSettings({
            enabled: true,
            hostTarget: '192.168.1.20:80',
            connectionStatus: 'connected',
            discoveredHosts: ['http://192.168.1.20:80/VaultBill/'],
        });

        expect(readAndroidPairingSettings()).toEqual({
            enabled: true,
            hostTarget: 'http://192.168.1.20:80/VaultBill/',
            connectionStatus: 'connected',
            discoveredHosts: ['http://192.168.1.20:80/VaultBill/'],
        });
    });

    it('falls back to defaults when stored settings are invalid', () => {
        window.localStorage.setItem(androidPairingStorageKey, '{not-json');

        expect(readAndroidPairingSettings()).toEqual(defaultAndroidPairingSettings);
    });

    it('keeps only responding pairing hosts in scan results', async () => {
        const targetHost = 'http://192.168.1.20:80/VaultBill/';
        const targetHealthUrl = 'http://192.168.1.20/health';
        const fetchMock = vi.fn((input: string | URL | Request) => {
            const requestUrl =
                typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
            return Promise.resolve({ ok: requestUrl === targetHealthUrl } as Response);
        });
        vi.stubGlobal('fetch', fetchMock);
        vi.spyOn(window, 'setTimeout').mockImplementation(
            (() => 0) as unknown as typeof window.setTimeout,
        );

        const hosts = await scanAndroidPairingHosts('192.168.1.20:80');

        expect(fetchMock).toHaveBeenCalled();
        expect(fetchMock).toHaveBeenCalledWith(targetHealthUrl, expect.anything());
        expect(hosts).toEqual([targetHost]);
    });
});
