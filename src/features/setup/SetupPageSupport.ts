/** @format */

import { Building2, Sparkles, UserRoundCog } from 'lucide-react';

export { isThemeId, themeStorageKey } from '../../runtime/WorkspaceTheme';

/** Ordered first-run setup steps shown in the wizard header and content area. */
export const setupSteps = [
    { label: 'Welcome', icon: Sparkles },
    { label: 'Workspace Details', icon: Building2 },
    { label: 'Admin Access', icon: UserRoundCog },
] as const;

/** Local host names that are allowed to use the hosted setup completion API. */
export const localHostedOrigins = new Set(['localhost', '127.0.0.1', '[::1]']);

/** Removes Electron IPC framing so setup failures read clearly in the wizard. */
export const setupErrorMessage = (reason: unknown): string => {
    const message = reason instanceof Error ? reason.message : 'Setup could not be completed.';
    return message
        .replace(/^Error invoking remote method '[^']+':\s*/u, '')
        .replace(/^Error:\s*/u, '');
};

export const getBusinessProfileValidationMessage = (input: {
    readonly companyName: string;
    readonly address: string;
}): string => {
    const hasCompanyName = input.companyName.trim().length > 0;
    const hasAddress = input.address.trim().length > 0;

    if (!hasCompanyName && !hasAddress)
        return 'Business name and address are required to continue.';
    if (!hasCompanyName) return 'Business name is required to continue.';
    return 'Business address is required to continue.';
};

/** Returns the setup validation message for the first Admin account step. */
export const getAdminAccessValidationMessage = (input: {
    readonly adminDisplayName: string;
    readonly adminUsername: string;
}): string => {
    const hasDisplayName = input.adminDisplayName.trim().length > 0;
    const hasUsername = input.adminUsername.trim().length > 0;

    if (!hasDisplayName && !hasUsername) return 'Admin display name and username are required.';
    if (!hasDisplayName) return 'Admin display name is required.';
    return 'Admin username is required.';
};
