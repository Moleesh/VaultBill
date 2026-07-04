/** @format */

import { useQuery } from '@tanstack/react-query';

import { useCapabilities } from '../../capability/CapabilityContext';
import { getRuntimeQueryScope, queryKeys } from '../../query/QueryKeys';
import { fetchWorkspaceSettings } from '../../query/RuntimeQueries';
import { defaultWorkspaceSettings } from '../../runtime/WorkspaceSettings';
import { useSession } from '../auth/SessionContext';

import { useReportsPageFilters } from './useReportsPageFilters';
import { useReportsPagePaging } from './useReportsPagePaging';

export const useReportsPageData = () => {
    const capabilities = useCapabilities();
    const { operatorContext } = useSession();
    const runtimeScope = getRuntimeQueryScope(capabilities);
    const workspaceSettingsQuery = useQuery({
        queryKey: queryKeys.workspaceSettings(runtimeScope),
        queryFn: () => fetchWorkspaceSettings({ capabilities }),
        staleTime: Number.POSITIVE_INFINITY,
    });
    const workspaceSettings = workspaceSettingsQuery.data ?? defaultWorkspaceSettings;
    const filters = useReportsPageFilters(
        workspaceSettings.includeDraftsInReports,
        operatorContext
            ? { role: operatorContext.role, userId: operatorContext.account.userId }
            : undefined,
    );

    const paging = useReportsPagePaging(
        filters.query,
        filters.browserMatchingRecords,
        filters.visibleCount,
        filters.setVisibleCount,
        filters.status,
    );

    return {
        capabilities,
        ...filters,
        ...paging,
        error: paging.pageError,
        isLoading: paging.pageLoading,
        toDate: filters.toDate,
        workspaceSettings,
    } as const;
};
