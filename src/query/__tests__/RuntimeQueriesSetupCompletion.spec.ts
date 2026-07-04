/** @format */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultPasswordHash } from '../../features/auth/SessionSupport';
import { defaultWorkspaceSettings } from '../../runtime/WorkspaceSettings';

const workspaceSettingsMocks = vi.hoisted(() => ({
    saveLocalWorkspaceSettings: vi.fn(),
}));

const sessionSupportMocks = vi.hoisted(() => ({
    hashPassword: vi.fn(),
}));

vi.mock('../../runtime/WorkspaceSettings', async () => {
    const actual = await vi.importActual('../../runtime/WorkspaceSettings');
    return {
        ...actual,
        saveLocalWorkspaceSettings: workspaceSettingsMocks.saveLocalWorkspaceSettings,
    };
});

vi.mock('../../features/auth/SessionSupport', async () => {
    const actual = await vi.importActual('../../features/auth/SessionSupport');
    return {
        ...actual,
        hashPassword: sessionSupportMocks.hashPassword,
    };
});
import { completeRuntimeSetup } from '../RuntimeQueries';

describe('RuntimeQueries setup completion', () => {
    beforeEach(() => {
        window.localStorage.clear();
        vi.clearAllMocks();
        sessionSupportMocks.hashPassword.mockResolvedValue('hashed-password');
    });

    it('completes local setup by persisting workspace settings and bootstrap accounts', async () => {
        await completeRuntimeSetup({
            capabilities: { isHostedWeb: false },
            canUseHostedSetupApi: false,
            selectedTheme: 'indigo-mint',
            value: {
                companyName: 'VaultBill Labs',
                address: '42 Market Street',
                adminUsername: 'opsadmin',
                adminDisplayName: 'Ops Admin',
                adminPassword: 'secret',
                clearAdminPassword: false,
            },
        });

        expect(workspaceSettingsMocks.saveLocalWorkspaceSettings).toHaveBeenCalledWith({
            ...defaultWorkspaceSettings,
            companyName: 'VaultBill Labs',
            address: '42 Market Street',
            theme: 'indigo-mint',
        });
        expect(sessionSupportMocks.hashPassword).toHaveBeenCalledWith('secret');
        expect(
            JSON.parse(window.localStorage.getItem('vaultbill.local-setup-accounts') ?? '[]'),
        ).toEqual([
            {
                userId: 'sysadmin_1',
                username: 'sysadmin',
                displayName: 'System Administrator',
                role: 'SysAdmin',
                isActive: true,
                passwordHash: defaultPasswordHash,
            },
            {
                userId: 'admin_1',
                username: 'opsadmin',
                displayName: 'Ops Admin',
                role: 'Admin',
                isActive: true,
                passwordHash: 'hashed-password',
            },
        ]);
    });
});
