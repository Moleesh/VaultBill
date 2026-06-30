/** @format */

import { useEffect, useState } from 'react';

import { useReportsPageFilters } from './useReportsPageFilters';
import { useReportsPagePaging } from './useReportsPagePaging';
import { useCapabilities } from '../../capability/CapabilityContext';
import {
    defaultWorkspaceSettings,
    loadWorkspaceSettings,
    type WorkspaceSettings,
} from '../../runtime/WorkspaceSettings';

export const useReportsPageData = () => {
    const capabilities = useCapabilities();
    const [workspaceSettings, setWorkspaceSettings] =
        useState<WorkspaceSettings>(defaultWorkspaceSettings);
    const filters = useReportsPageFilters(workspaceSettings.includeDraftsInReports);

    useEffect(() => {
        void loadWorkspaceSettings(capabilities.isHostedWeb)
            .then(setWorkspaceSettings)
            .catch(() => {
                setWorkspaceSettings(defaultWorkspaceSettings);
            });
    }, [capabilities.isHostedWeb]);

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
