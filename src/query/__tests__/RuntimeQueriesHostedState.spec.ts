/** @format */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultWorkspaceSettings } from '../../runtime/WorkspaceSettings';

const hostedApiMocks = vi.hoisted(() => ({
    requestHostedApi: vi.fn(),
}));

vi.mock('../../runtime/HostedApi', async () => {
    const actual = await vi.importActual('../../runtime/HostedApi');
    return {
        ...actual,
        requestHostedApi: hostedApiMocks.requestHostedApi,
    };
});
import {
    fetchHostedWebUrl,
    fetchSecurityRuntimeState,
    fetchSysAdminDashboardState,
    fetchWorkspaceSettings,
    saveIncludeDraftsInReports,
} from '../RuntimeQueries';

describe('RuntimeQueries hosted state', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        delete (window as Partial<Window> & { vaultBillDesktop?: unknown }).vaultBillDesktop;
    });

    it('reads hosted security, dashboard, and workspace snapshots through shared queries', async () => {
        hostedApiMocks.requestHostedApi.mockImplementation((path: string) => {
            switch (path) {
                case '/credentials/status':
                    return Promise.resolve({
                        sysAdminPasswordConfigured: true,
                        backupPasswordConfigured: false,
                    });
                case '/trial/status':
                    return Promise.resolve({
                        isFullVersion: false,
                        isExpired: false,
                        remainingSeconds: 600,
                    });
                case '/settings/business':
                    return Promise.resolve({
                        ...defaultWorkspaceSettings,
                        companyName: 'Hosted Co',
                        address: '99 Marina Road',
                        includeDraftsInReports: false,
                    });
                case '/builder/inventory':
                    return Promise.resolve([
                        {
                            formatId: 'sales-register',
                            formatName: 'Sales register',
                            isDefault: true,
                            updatedAt: '2026-07-03T00:00:00.000Z',
                            templateName: 'Classic',
                            assetCount: 2,
                            isValid: true,
                        },
                    ]);
                case '/records':
                    return Promise.resolve([{ status: 'Draft' }, { status: 'Finalized' }]);
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
                            {
                                userId: 'user_1',
                                username: 'user',
                                displayName: 'User',
                                role: 'User',
                                isActive: false,
                            },
                        ],
                    });
                case '/backup/status':
                    return Promise.resolve({ lastBackupAt: '2026-07-03T10:00:00.000Z' });
                default:
                    return Promise.reject(new Error(`Unexpected path ${path}`));
            }
        });

        await expect(
            fetchSecurityRuntimeState({
                capabilities: { isHostedWeb: true },
            }),
        ).resolves.toEqual({
            credentialStatus: {
                sysAdminPasswordConfigured: true,
                backupPasswordConfigured: false,
            },
            lanEnabled: false,
            hostedWebAutoStart: false,
            hostedWebServerRunning: false,
            trialStatus: {
                isFullVersion: false,
                isExpired: false,
                remainingSeconds: 600,
            },
        });

        await expect(
            fetchWorkspaceSettings({
                capabilities: { isHostedWeb: true },
            }),
        ).resolves.toMatchObject({
            companyName: 'Hosted Co',
            address: '99 Marina Road',
            includeDraftsInReports: false,
        });

        await expect(
            fetchSysAdminDashboardState({
                accounts: [
                    {
                        isActive: true,
                    },
                    {
                        isActive: false,
                    },
                ],
                capabilities: { isHostedWeb: true },
            }),
        ).resolves.toMatchObject({
            summary: {
                formatCount: 1,
                defaultFormatCount: 1,
                templateCount: 1,
                recordCount: 2,
                draftCount: 1,
                finalizedCount: 1,
                cancelledCount: 0,
                accountCount: 2,
                activeAccountCount: 1,
                lastBackupAt: '2026-07-03T10:00:00.000Z',
                trialRemainingSeconds: 600,
                isTrialExpired: false,
                isFullVersion: false,
            },
        });
        expect(hostedApiMocks.requestHostedApi).not.toHaveBeenCalledWith('/auth/snapshot');
    });

    it('persists hosted include-drafts settings and resolves hosted-web URLs', async () => {
        hostedApiMocks.requestHostedApi.mockImplementation((path: string, method?: string) => {
            if (path === '/settings/business' && method === undefined) {
                return Promise.resolve({
                    ...defaultWorkspaceSettings,
                    companyName: 'Hosted Co',
                    address: '99 Marina Road',
                    includeDraftsInReports: false,
                });
            }
            if (path === '/settings/business' && method === 'POST') {
                return Promise.resolve(undefined);
            }
            throw new Error(`Unexpected path ${path}`);
        });

        await expect(
            saveIncludeDraftsInReports({
                capabilities: { isHostedWeb: true },
                value: true,
            }),
        ).resolves.toMatchObject({
            includeDraftsInReports: true,
        });

        expect(hostedApiMocks.requestHostedApi).toHaveBeenCalledWith('/settings/business', 'POST', {
            ...defaultWorkspaceSettings,
            companyName: 'Hosted Co',
            address: '99 Marina Road',
            includeDraftsInReports: true,
        });

        Object.defineProperty(window, 'vaultBillDesktop', {
            configurable: true,
            value: {
                getHostedWebUrl: vi.fn().mockResolvedValue('http://127.0.0.1:80/VaultBill/'),
            } as const,
        });

        await expect(
            fetchHostedWebUrl({
                capabilities: { isHostedWeb: false },
            }),
        ).resolves.toBe('http://127.0.0.1:80/VaultBill/');

        delete (window as Partial<Window> & { vaultBillDesktop?: unknown }).vaultBillDesktop;

        await expect(
            fetchHostedWebUrl({
                capabilities: { isHostedWeb: true },
            }),
        ).resolves.toBe(window.location.origin);
    });
});
