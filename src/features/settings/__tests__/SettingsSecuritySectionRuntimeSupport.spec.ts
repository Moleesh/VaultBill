/** @format */

import { describe, expect, it, vi } from 'vitest';

import {
    runHostedWebServerAction,
    saveHostedWebConfiguration,
} from '../SettingsSecuritySectionRuntimeSupport';

describe('SettingsSecuritySectionRuntimeSupport', () => {
    it('persists hosted web configuration through the desktop bridge', async () => {
        const configureLocalApi = vi.fn().mockResolvedValue(undefined);

        await saveHostedWebConfiguration({
            autoStart: false,
            desktopBridge: {
                configureLocalApi,
                restartHostedWebServer: vi.fn(),
                startHostedWebServer: vi.fn(),
                stopHostedWebServer: vi.fn(),
            },
            lanEnabled: true,
            port: 5173,
        });

        expect(configureLocalApi).toHaveBeenCalledWith({
            autoStart: false,
            lanEnabled: true,
            passwordRequired: true,
            port: 5173,
        });
    });

    it('returns the latest hosted web running state from bridge actions', async () => {
        const startHostedWebServer = vi.fn().mockResolvedValue({ isRunning: true });

        await expect(
            runHostedWebServerAction('startHostedWebServer', {
                configureLocalApi: vi.fn(),
                restartHostedWebServer: vi.fn(),
                startHostedWebServer,
                stopHostedWebServer: vi.fn(),
            }),
        ).resolves.toBe(true);

        expect(startHostedWebServer).toHaveBeenCalled();
    });

    it('throws a clear runtime error when bridge actions are unavailable', async () => {
        await expect(runHostedWebServerAction('stopHostedWebServer', undefined)).rejects.toThrow(
            'Desktop runtime is unavailable.',
        );
    });
});
