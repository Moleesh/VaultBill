/** @format */

import { useEffect, useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import type { CapabilityRegistry } from '../capability/Capability.types';
import type { OperatorContext } from '../features/auth/AccountTypes';
import { getRuntimeQueryScope, queryKeys } from '../query/QueryKeys';
import { fetchWorkspaceSettings } from '../query/RuntimeQueries';
import { defaultWorkspaceSettings } from '../runtime/WorkspaceSettings';
import {
    getStoredUserTheme,
    resolveThemeFromWorkspaceSettings,
    saveStoredUserTheme,
} from '../runtime/WorkspaceTheme';
import type { ThemeController } from '../types/AppTypes';

import { useThemeController } from './useThemeController';

/**
 * Keeps the authenticated shell aligned with the workspace theme while allowing
 * each operator to keep a separate personal theme preference.
 */
export const usePersistentWorkspaceTheme = ({
    capabilities,
    operatorContext,
}: {
    readonly capabilities: Pick<
        CapabilityRegistry,
        'isDemoMode' | 'isDesktop' | 'isHostedWeb' | 'runtimePlatform'
    >;
    readonly operatorContext: OperatorContext | undefined;
}): ThemeController => {
    const runtimeScope = getRuntimeQueryScope(capabilities);
    const [personalThemeId, setPersonalThemeId] = useState(() => {
        if (!operatorContext) return undefined;
        return getStoredUserTheme(operatorContext.account.userId);
    });
    const workspaceSettingsQuery = useQuery({
        queryKey: queryKeys.workspaceSettings(runtimeScope),
        enabled: operatorContext !== undefined,
        queryFn: () => fetchWorkspaceSettings({ capabilities }),
        staleTime: Number.POSITIVE_INFINITY,
    });
    const resolvedThemeId = useMemo(() => {
        if (!operatorContext) return undefined;
        return resolveThemeFromWorkspaceSettings(
            workspaceSettingsQuery.data ?? defaultWorkspaceSettings,
        );
    }, [operatorContext, workspaceSettingsQuery.data]);

    useEffect(() => {
        if (!operatorContext) {
            setPersonalThemeId(undefined);
            return;
        }

        setPersonalThemeId(getStoredUserTheme(operatorContext.account.userId));
    }, [operatorContext]);

    const fallbackThemeId = resolvedThemeId ?? 'teal-flow';
    const syncedThemeId = personalThemeId ?? resolvedThemeId;

    return useThemeController(
        fallbackThemeId,
        (themeId) => {
            if (!operatorContext) return;
            saveStoredUserTheme(operatorContext.account.userId, themeId);
            setPersonalThemeId(themeId);
        },
        syncedThemeId,
    );
};
