/** @format */

import { useQuery } from '@tanstack/react-query';

import { useCapabilities } from '../../capability/CapabilityContext';
import { getRuntimeQueryScope, queryKeys } from '../../query/QueryKeys';
import {
    fetchBuilderPackage,
    fetchPublishedFormats,
    fetchWorkspaceSettings,
} from '../../query/RuntimeQueries';
import { isStaticHostedBrowserBuild } from '../../runtime/RuntimeMode';
import { defaultWorkspaceSettings } from '../../runtime/WorkspaceSettings';
import { useSession } from '../auth/SessionContext';
import { reportFieldOptionsForDocument } from './ReportsPageSupport';

import { resolveRecordsFormatOptions } from '../records/useRecordsPageStateSupport';
import { useReportsPageFilters } from './useReportsPageFilters';
import { useReportsPagePaging } from './useReportsPagePaging';

export const useReportsPageData = () => {
    const capabilities = useCapabilities();
    const { operatorContext } = useSession();
    const runtimeScope = getRuntimeQueryScope(capabilities);
    const usesStaticHostedBrowserBuild = isStaticHostedBrowserBuild(capabilities);
    const workspaceSettingsQuery = useQuery({
        queryKey: queryKeys.workspaceSettings(runtimeScope),
        queryFn: () => fetchWorkspaceSettings({ capabilities }),
        staleTime: Number.POSITIVE_INFINITY,
    });
    const publishedFormatsQuery = useQuery({
        queryKey: queryKeys.publishedFormats(runtimeScope),
        queryFn: () => fetchPublishedFormats({ capabilities }),
        refetchOnMount: 'always',
        staleTime: Number.POSITIVE_INFINITY,
    });
    const workspaceSettings = workspaceSettingsQuery.data ?? defaultWorkspaceSettings;
    const formatOptions = resolveRecordsFormatOptions(
        publishedFormatsQuery.data ?? [],
        usesStaticHostedBrowserBuild,
    );
    const filters = useReportsPageFilters(
        workspaceSettings.includeDraftsInReports,
        operatorContext
            ? { role: operatorContext.role, userId: operatorContext.account.userId }
            : undefined,
        formatOptions,
    );
    const activeBuilderPackageQuery = useQuery({
        queryKey: queryKeys.builderPackage(runtimeScope, filters.formatId || '__current__'),
        queryFn: () => fetchBuilderPackage({ capabilities, formatId: filters.formatId }),
        enabled: Boolean(filters.formatId),
        staleTime: Number.POSITIVE_INFINITY,
    });
    const dynamicReportFieldOptions = reportFieldOptionsForDocument(
        activeBuilderPackageQuery.data?.config as Parameters<
            typeof reportFieldOptionsForDocument
        >[0],
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
        formatOptions,
        reportFieldOptions: dynamicReportFieldOptions,
        ...filters,
        ...paging,
        error: paging.pageError,
        isLoading: paging.pageLoading,
        toDate: filters.toDate,
        workspaceSettings,
    } as const;
};
