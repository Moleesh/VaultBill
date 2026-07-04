/** @format */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { themeOptions } from '../constants/RuntimeDefaults';
import { applyTheme, getStoredTheme } from '../runtime/WorkspaceTheme';
import type { ThemeController, ThemeId } from '../types/AppTypes';

export const useThemeController = (
    fallbackTheme: ThemeId,
    onThemeChange?: (themeId: ThemeId) => void,
): ThemeController => {
    const [themeId, setThemeId] = useState<ThemeId>(() => {
        return getStoredTheme() ?? fallbackTheme;
    });

    useEffect(() => {
        applyTheme(themeId);
    }, [themeId]);

    const updateThemeId = useCallback(
        (nextThemeId: ThemeId) => {
            setThemeId((currentThemeId) => {
                if (currentThemeId === nextThemeId) return currentThemeId;
                onThemeChange?.(nextThemeId);
                return nextThemeId;
            });
        },
        [onThemeChange],
    );

    return useMemo(
        () => ({
            themeId,
            setThemeId: updateThemeId,
            availableThemes: themeOptions,
        }),
        [themeId, updateThemeId],
    );
};
