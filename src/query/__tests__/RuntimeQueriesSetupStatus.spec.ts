/** @format */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultWorkspaceSettings } from '../../runtime/WorkspaceSettings';

const hostedApiMocks = vi.hoisted(() => ({
    canUseLocalHostedApi: vi.fn(),
    requestHostedApi: vi.fn(),
}));

const workspaceSettingsMocks = vi.hoisted(() => ({
    loadWorkspaceSettings: vi.fn(),
}));

vi.mock('../../runtime/HostedApi', async () => {
    const actual = await vi.importActual('../../runtime/HostedApi');
    return {
        ...actual,
        canUseLocalHostedApi: hostedApiMocks.canUseLocalHostedApi,
        requestHostedApi: hostedApiMocks.requestHostedApi,
    };
});

vi.mock('../../runtime/WorkspaceSettings', async () => {
    const actual = await vi.importActual('../../runtime/WorkspaceSettings');
    return {
        ...actual,
        loadWorkspaceSettings: workspaceSettingsMocks.loadWorkspaceSettings,
    };
});
import { fetchSetupDefaults, fetchSetupStatus } from '../RuntimeQueries';

describe('RuntimeQueries setup status', () => {
    beforeEach(() => {
        window.localStorage.clear();
        vi.clearAllMocks();
        hostedApiMocks.canUseLocalHostedApi.mockReturnValue(false);
        workspaceSettingsMocks.loadWorkspaceSettings.mockResolvedValue(defaultWorkspaceSettings);
    });

    afterEach(() => {
        delete (window as Partial<Window> & { vaultBillDesktop?: unknown }).vaultBillDesktop;
    });

    it('returns a non-setup-required snapshot for non DB-backed runtimes', async () => {
        await expect(
            fetchSetupStatus({
                hasLocalDb: false,
                isDemoMode: true,
                isDesktop: false,
                isHostedWeb: false,
                runtimePlatform: 'demo',
            }),
        ).resolves.toEqual({ isSetupRequired: false });
    });

    it('reads setup status and defaults through hosted APIs when available', async () => {
        hostedApiMocks.requestHostedApi.mockImplementation((path: string) => {
            switch (path) {
                case '/setup/status':
                    return Promise.resolve({
                        hasActiveAdmin: true,
                        business: {
                            companyName: 'VaultBill Labs',
                            address: '42 Market Street',
                        },
                    });
                case '/workspace/settings':
                    return Promise.resolve({
                        ...defaultWorkspaceSettings,
                        companyName: 'VaultBill Labs',
                        address: '42 Market Street',
                    });
                case '/auth/snapshot':
                    return Promise.resolve({
                        accounts: [
                            {
                                userId: 'admin_1',
                                username: 'admin',
                                displayName: 'Admin',
                                role: 'Admin',
                                isActive: true,
                            },
                        ],
                    });
                default:
                    return Promise.reject(new Error(`Unexpected path ${path}`));
            }
        });

        await expect(
            fetchSetupStatus({
                hasLocalDb: true,
                isDemoMode: false,
                isDesktop: false,
                isHostedWeb: true,
                runtimePlatform: 'hosted-web',
            }),
        ).resolves.toEqual({ isSetupRequired: false });

        await expect(
            fetchSetupDefaults({
                capabilities: { isHostedWeb: true },
                canUseHostedSetupApi: true,
            }),
        ).resolves.toMatchObject({
            business: {
                companyName: 'VaultBill Labs',
                address: '42 Market Street',
            },
            accounts: [{ userId: 'admin_1', username: 'admin' }],
        });
    });

    it('falls back to desktop or local setup defaults when hosted APIs are unavailable', async () => {
        hostedApiMocks.requestHostedApi.mockRejectedValue(new Error('offline'));
        Object.defineProperty(window, 'vaultBillDesktop', {
            configurable: true,
            value: {
                getBusinessSettings: vi.fn().mockResolvedValue({
                    companyName: 'Desktop Co',
                    address: '',
                }),
                listAccounts: vi.fn().mockResolvedValue([
                    {
                        userId: 'admin_1',
                        username: 'admin',
                        displayName: 'Admin',
                        role: 'Admin',
                        isActive: true,
                    },
                ]),
            } as const,
        });

        await expect(
            fetchSetupStatus({
                hasLocalDb: true,
                isDemoMode: false,
                isDesktop: false,
                isHostedWeb: true,
                runtimePlatform: 'hosted-web',
            }),
        ).resolves.toEqual({ isSetupRequired: true });

        delete (window as Partial<Window> & { vaultBillDesktop?: unknown }).vaultBillDesktop;
        workspaceSettingsMocks.loadWorkspaceSettings.mockResolvedValue({
            ...defaultWorkspaceSettings,
            companyName: 'Local Co',
            address: '1 Bazaar Street',
        });
        window.localStorage.setItem(
            'vaultbill.local-setup-accounts',
            JSON.stringify([
                {
                    userId: 'admin_1',
                    username: 'admin',
                    displayName: 'Admin',
                    role: 'Admin',
                    isActive: true,
                },
            ]),
        );

        await expect(
            fetchSetupDefaults({
                capabilities: { isHostedWeb: false },
                canUseHostedSetupApi: false,
            }),
        ).resolves.toMatchObject({
            business: {
                companyName: 'Local Co',
                address: '1 Bazaar Street',
            },
            accounts: [{ userId: 'admin_1', username: 'admin' }],
        });
    });
});
