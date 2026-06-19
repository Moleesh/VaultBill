/** @format */

import { useEffect, useState } from 'react';

import { themeOptions } from '../constants/RuntimeDefaults';
import type { ThemeController, ThemeId } from '../types/AppTypes';

const themeStorageKey = 'vaultbill.theme';

const isThemeId = (value: string): value is ThemeId =>
    themeOptions.some((theme) => theme.id === value);

export const useThemeController = (fallbackTheme: ThemeId): ThemeController => {
    const [themeId, setThemeId] = useState<ThemeId>(() => {
        const savedTheme = window.localStorage.getItem(themeStorageKey);
        return savedTheme && isThemeId(savedTheme) ? savedTheme : fallbackTheme;
    });

    useEffect(() => {
        document.documentElement.dataset.theme = themeId;
        window.localStorage.setItem(themeStorageKey, themeId);
    }, [themeId]);

    return {
        themeId,
        setThemeId,
        availableThemes: themeOptions,
    };
};
