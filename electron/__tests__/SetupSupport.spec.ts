/** @format */

// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

import { completeSetup, readSetupStatus } from '../SetupSupport.js';

describe('SetupSupport', () => {
    it('reports setup as incomplete until an active admin and business profile exist', () => {
        const credentialStore = {
            listAccounts: vi.fn(() => [{ role: 'User', isActive: true }]),
        };
        const settingsStore = {
            getBusiness: vi.fn(() => ({ companyName: '', address: '', theme: 'teal-flow' })),
        };

        expect(readSetupStatus(credentialStore as never, settingsStore as never)).toEqual({
            isSetupComplete: false,
            hasActiveAdmin: false,
            business: {
                companyName: '',
                address: '',
            },
        });
    });

    it('saves business details and creates the first admin during setup completion', () => {
        const credentialStore = {
            clearPassword: vi.fn(),
            listAccounts: vi.fn(() => []),
            resetPassword: vi.fn(),
            saveAccount: vi.fn(),
        };
        const settingsStore = {
            getBusiness: vi.fn(() => ({
                companyName: '',
                address: '',
                theme: 'teal-flow',
                gstin: '',
            })),
            saveBusiness: vi.fn(),
        };

        completeSetup(credentialStore as never, settingsStore as never, {
            companyName: ' VaultBill ',
            address: ' Chennai ',
            theme: 'slate-pro',
            adminUsername: ' admin ',
            adminDisplayName: ' System Admin ',
            adminPassword: ' secret ',
        });

        expect(settingsStore.saveBusiness).toHaveBeenCalledWith(
            expect.objectContaining({
                companyName: 'VaultBill',
                address: 'Chennai',
                theme: 'slate-pro',
            }),
        );
        expect(credentialStore.saveAccount).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 'admin_1',
                username: 'admin',
                displayName: 'System Admin',
                role: 'Admin',
                isActive: true,
            }),
        );
        expect(credentialStore.resetPassword).toHaveBeenCalledWith('admin_1', 'secret');
    });

    it('clears an existing admin password when requested', () => {
        const credentialStore = {
            clearPassword: vi.fn(),
            listAccounts: vi.fn(() => [{ userId: 'admin_2', role: 'Admin', isActive: true }]),
            resetPassword: vi.fn(),
            saveAccount: vi.fn(),
        };
        const settingsStore = {
            getBusiness: vi.fn(() => ({ companyName: 'A', address: 'B', theme: 'teal-flow' })),
            saveBusiness: vi.fn(),
        };

        completeSetup(credentialStore as never, settingsStore as never, {
            companyName: 'A',
            address: 'B',
            theme: 'teal-flow',
            adminUsername: 'admin',
            adminDisplayName: 'Admin',
            clearAdminPassword: true,
        });

        expect(credentialStore.clearPassword).toHaveBeenCalledWith('admin_2');
        expect(credentialStore.resetPassword).not.toHaveBeenCalled();
    });
});
