/** @format */

import { z } from 'zod';

import type { CredentialStore } from './CredentialStore.js';
import type { SettingsStore } from './SettingsStore.js';

const OptionalAdminPasswordSchema = z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? '');

export const SetupCompleteRequestSchema = z.object({
    companyName: z.string().trim().min(1),
    address: z.string().trim().min(1),
    theme: z.string().trim().min(1),
    adminUsername: z.string().trim().min(1),
    adminDisplayName: z.string().trim().min(1),
    adminPassword: OptionalAdminPasswordSchema,
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
        theme: setup.theme,
    });
    const existingAdmin = credentialStore
        .listAccounts()
        .find((account) => account.role === 'Admin' && account.isActive);
    const adminUserId = existingAdmin?.userId ?? 'admin_1';
    credentialStore.saveAccount({
        userId: adminUserId,
        username: setup.adminUsername,
        displayName: setup.adminDisplayName,
        role: 'Admin',
        isActive: true,
    });
    if (setup.adminPassword.length > 0) {
        credentialStore.resetPassword(adminUserId, setup.adminPassword);
    }
};
