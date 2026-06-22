/** @format */

import { themeOptions } from '../constants/RuntimeDefaults';
import { type ThemeId } from '../types/AppTypes';
import { loadWorkspaceSettings, type WorkspaceSettings } from './WorkspaceSettings';

export const themeStorageKey = 'vaultbill.theme';

export const isThemeId = (value: string): value is ThemeId =>
    themeOptions.some((theme) => theme.id === value);

export const getStoredTheme = (): ThemeId | undefined => {
    const storedTheme = window.localStorage.getItem(themeStorageKey);
    return storedTheme && isThemeId(storedTheme) ? storedTheme : undefined;
};

export const applyTheme = (theme: string) => {
    if (!isThemeId(theme)) return;
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(themeStorageKey, theme);
};

export const resolveThemeFromWorkspaceSettings = (
    settings: Pick<WorkspaceSettings, 'address' | 'companyName' | 'theme'>,
): ThemeId => {
    const hasConfiguredWorkspace =
        settings.companyName.trim().length > 0 && settings.address.trim().length > 0;

    if (hasConfiguredWorkspace && isThemeId(settings.theme)) {
        return settings.theme;
    }

    return getStoredTheme() ?? 'teal-flow';
};

export const loadResolvedTheme = async (isHostedWeb: boolean): Promise<ThemeId> => {
    const settings = await loadWorkspaceSettings(isHostedWeb);
    return resolveThemeFromWorkspaceSettings(settings);
};
