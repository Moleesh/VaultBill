/** @format */

import { useEffect, useState } from 'react';

import { themeOptions } from '../constants/RuntimeDefaults';
import { applyTheme, getStoredTheme } from '../runtime/WorkspaceTheme';
import type { ThemeController, ThemeId } from '../types/AppTypes';

export const useThemeController = (fallbackTheme: ThemeId): ThemeController => {
    const [themeId, setThemeId] = useState<ThemeId>(() => {
        return getStoredTheme() ?? fallbackTheme;
    });

    useEffect(() => {
        applyTheme(themeId);
    }, [themeId]);

    return {
        themeId,
        setThemeId,
        availableThemes: themeOptions,
    };
};
