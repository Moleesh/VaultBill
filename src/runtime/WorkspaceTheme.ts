/** @format */

import { themeOptions } from '../constants/RuntimeDefaults';
import { type ThemeId } from '../types/AppTypes';
import { loadWorkspaceSettings, type WorkspaceSettings } from './WorkspaceSettings';

export const themeStorageKey = 'vaultbill.theme';
export const userThemeStorageKeyPrefix = 'vaultbill.theme.user.';

export const themeSwatches: Readonly<Record<ThemeId, readonly [string, string]>> = {
    'teal-flow': ['#0f766e', '#d9f0ea'],
    'slate-pro': ['#334155', '#dbe4ee'],
    'midnight-ink': ['#101827', '#60a5fa'],
    'sandstone-ledger': ['#8a5b32', '#efe1cb'],
    'indigo-mint': ['#4338ca', '#c7f4e5'],
};

export const getThemeSwatchBackground = (themeId: ThemeId): string =>
    `linear-gradient(135deg, ${themeSwatches[themeId][0]} 50%, ${themeSwatches[themeId][1]} 50%)`;

export const isThemeId = (value: string): value is ThemeId =>
    themeOptions.some((theme) => theme.id === value);

export const getStoredTheme = (): ThemeId | undefined => {
    const storedTheme = window.localStorage.getItem(themeStorageKey);
    return storedTheme && isThemeId(storedTheme) ? storedTheme : undefined;
};

export const getUserThemeStorageKey = (userId: string): string =>
    `${userThemeStorageKeyPrefix}${userId}`;

export const getStoredUserTheme = (userId: string): ThemeId | undefined => {
    const storedTheme = window.localStorage.getItem(getUserThemeStorageKey(userId));
    if (storedTheme && isThemeId(storedTheme)) {
        return storedTheme;
    }

    return getStoredTheme();
};

export const saveStoredUserTheme = (userId: string, themeId: ThemeId) => {
    window.localStorage.setItem(getUserThemeStorageKey(userId), themeId);
};

export const applyTheme = (theme: string) => {
    if (!isThemeId(theme)) return;
    document.documentElement.dataset.theme = theme;
};

export const resolveThemeFromWorkspaceSettings = (
    settings: Pick<WorkspaceSettings, 'address' | 'companyName' | 'theme'>,
): ThemeId => {
    const hasConfiguredWorkspace =
        settings.companyName.trim().length > 0 && settings.address.trim().length > 0;

    if (hasConfiguredWorkspace && isThemeId(settings.theme)) {
        return settings.theme;
    }

    return 'teal-flow';
};

export const loadResolvedTheme = async (isHostedWeb: boolean): Promise<ThemeId> => {
    const settings = await loadWorkspaceSettings(isHostedWeb);
    return resolveThemeFromWorkspaceSettings(settings);
};
