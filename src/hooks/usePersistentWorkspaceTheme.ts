/** @format */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { CapabilityRegistry } from '../capability/Capability.types';
import type { OperatorContext } from '../features/auth/AccountTypes';
import { getRuntimeQueryScope, queryKeys } from '../query/QueryKeys';
import { fetchWorkspaceSettings, saveWorkspaceSettings } from '../query/RuntimeQueries';
import type { ThemeController, ThemeId } from '../types/AppTypes';

import { useThemeController } from './useThemeController';

/**
 * Keeps shell theme changes aligned with the persisted workspace theme when the
 * active operator is allowed to update workspace settings.
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
    const queryClient = useQueryClient();
    const runtimeScope = getRuntimeQueryScope(capabilities);
    const persistThemeMutation = useMutation({
        mutationFn: async (theme: ThemeId) => {
            if (operatorContext?.role !== 'SysAdmin') return;

            const current = await fetchWorkspaceSettings({ capabilities });
            const nextSettings = { ...current, theme };
            await saveWorkspaceSettings({
                capabilities,
                settings: nextSettings,
            });
            return nextSettings;
        },
        onSuccess: async (nextSettings) => {
            if (!nextSettings) return;
            queryClient.setQueryData(queryKeys.workspaceSettings(runtimeScope), nextSettings);
            await queryClient.invalidateQueries({
                queryKey: queryKeys.workspaceSettings(runtimeScope),
            });
        },
    });

    return useThemeController('teal-flow', (themeId) => {
        if (operatorContext?.role !== 'SysAdmin') return;
        void persistThemeMutation.mutateAsync(themeId);
    });
};
