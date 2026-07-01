/** @format */

import { useQuery } from '@tanstack/react-query';

import { useReportsPageFilters } from './useReportsPageFilters';
import { useReportsPagePaging } from './useReportsPagePaging';
import { useCapabilities } from '../../capability/CapabilityContext';
import { defaultWorkspaceSettings } from '../../runtime/WorkspaceSettings';
import { getRuntimeQueryScope, queryKeys } from '../../query/QueryKeys';
import { fetchWorkspaceSettings } from '../../query/RuntimeQueries';

export const useReportsPageData = () => {
    const capabilities = useCapabilities();
    const runtimeScope = getRuntimeQueryScope(capabilities);
    const workspaceSettingsQuery = useQuery({
        queryKey: queryKeys.workspaceSettings(runtimeScope),
        queryFn: () => fetchWorkspaceSettings({ capabilities }),
    });
    const workspaceSettings = workspaceSettingsQuery.data ?? defaultWorkspaceSettings;
    const filters = useReportsPageFilters(workspaceSettings.includeDraftsInReports);

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
