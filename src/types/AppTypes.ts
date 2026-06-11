/** @format */

import type { Capability } from '../engines/permissionEngine/PermissionTypes';

export type Role = 'SysAdmin' | 'Admin' | 'User';

export type ThemeId =
    | 'teal-flow'
    | 'midnight-ink'
    | 'slate-pro'
    | 'sandstone-ledger'
    | 'indigo-mint';

export type ShellSection = {
    readonly id: string;
    readonly label: string;
    readonly description: string;
    readonly isEnabled: boolean;
    readonly requiredCapabilities?: readonly Capability[];
};

export type RuntimeBranding = {
    readonly applicationName: string;
    readonly companyName: string;
    readonly tagline: string;
    readonly applicationLogoAssetId: string;
    readonly printLogoAssetId: string;
    readonly faviconAssetId: string;
};

export type DocumentFormatSummary = {
    readonly formatId: string;
    readonly formatName: string;
    readonly description: string;
    readonly isDefault: boolean;
};

export type ThemeController = {
    readonly themeId: ThemeId;
    readonly setThemeId: (themeId: ThemeId) => void;
    readonly availableThemes: readonly ThemeOption[];
};

export type ThemeOption = {
    readonly id: ThemeId;
    readonly label: string;
};

export type AppRouteId = 'dashboard' | 'records' | 'reports' | 'builder' | 'settings';
