/** @format */

import { z } from 'zod';

import type { CredentialStore } from './CredentialStore.js';
import type { SettingsStore } from './SettingsStore.js';

export const SetupCompleteRequestSchema = z.object({
    companyName: z.string().trim().min(1),
    address: z.string().trim().min(1),
    adminUsername: z.string().trim().min(1),
    adminDisplayName: z.string().trim().min(1),
});

export type SetupStatus = {
    readonly isSetupComplete: boolean;
    readonly hasActiveAdmin: boolean;
    readonly business: {
        readonly companyName: string;
        readonly address: string;
    };
};

export const readSetupStatus = (
    credentialStore: CredentialStore,
    settingsStore: SettingsStore,
): SetupStatus => {
    const business = settingsStore.getBusiness();
    const hasActiveAdmin = credentialStore
        .listAccounts()
        .some((account) => account.role === 'Admin' && account.isActive);

    return {
        isSetupComplete:
            hasActiveAdmin && business.companyName.length > 0 && business.address.length > 0,
        hasActiveAdmin,
        business: {
            companyName: business.companyName,
            address: business.address,
        },
    };
};

export const completeSetup = (
    credentialStore: CredentialStore,
    settingsStore: SettingsStore,
    request: unknown,
) => {
    const setup = SetupCompleteRequestSchema.parse(request);
    settingsStore.saveBusiness({
        ...settingsStore.getBusiness(),
        companyName: setup.companyName,
        address: setup.address,
    });
    const existingAdmin = credentialStore
        .listAccounts()
        .find((account) => account.role === 'Admin' && account.isActive);
    credentialStore.saveAccount({
        userId: existingAdmin?.userId ?? 'admin_1',
        username: setup.adminUsername,
        displayName: setup.adminDisplayName,
        role: 'Admin',
        isActive: true,
    });
};
