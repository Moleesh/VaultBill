/** @format */

import { useEffect, useRef, useState } from 'react';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { useCapabilities } from '../../capability/CapabilityContext';
import { getRuntimeQueryScope, queryKeys } from '../../query/QueryKeys';
import { fetchReportPage, fetchTrialStatus } from '../../query/RuntimeQueries';
import { canUseLocalHostedApi } from '../../runtime/HostedApi';
import { isStaticHostedBrowserBuild } from '../../runtime/RuntimeMode';
import type { AppRecord } from '../records/RecordStoreSupport';
import { pageSize, requestReportPage, type PrintTask } from './ReportsPageSupport';
import type { ReportFieldFilter } from './ReportsPageTypes';

type ReportQueryState = Readonly<{
    reportId: string;
    reportFilters: readonly ReportFieldFilter[];
    fromDate: string;
    toDate: string;
    status: string;
    preset: string;
    includeDraftsInReports: boolean;
    limit: number;
}>;

export const useReportsPagePaging = (
    query: ReportQueryState,
    browserMatchingRecords: readonly AppRecord[],
    visibleCount: number,
    setVisibleCount: (count: number | ((current: number) => number)) => void,
    status: string,
) => {
    const capabilities = useCapabilities();
    const runtimeScope = getRuntimeQueryScope(capabilities);
    const usesStaticHostedBrowserBuild = isStaticHostedBrowserBuild(capabilities);
    const [task, setTask] = useState<PrintTask>();
    const [printSource, setPrintSource] = useState<readonly AppRecord[]>([]);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const canReadTrialStatus = window.vaultBillDesktop !== undefined || capabilities.isHostedWeb;
    const trialStatusQuery = useQuery({
        queryKey: queryKeys.trialStatus(runtimeScope, 'reports-page'),
        enabled: canReadTrialStatus,
        queryFn: () => fetchTrialStatus({ capabilities }),
    });
    const usesServerPaging =
        window.vaultBillDesktop !== undefined ||
        (!usesStaticHostedBrowserBuild && (capabilities.isHostedWeb || canUseLocalHostedApi()));
    const trialExpired = trialStatusQuery.data?.isExpired ?? false;
    const reportPagesQuery = useInfiniteQuery({
        queryKey: queryKeys.reportResults(runtimeScope, query),
        enabled: usesServerPaging,
        initialPageParam: undefined as string | undefined,
        queryFn: ({ pageParam }) =>
            fetchReportPage({
                canUseHostedReportsApi: !window.vaultBillDesktop && usesServerPaging,
                query,
                ...(pageParam ? { cursor: pageParam } : {}),
            }),
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    });
    const serverPages = reportPagesQuery.data?.pages ?? [];
    const serverRecords = serverPages.flatMap((page) => page.rows);
    const serverTotal = serverPages[0]?.total ?? 0;
    const nextCursor = reportPagesQuery.hasNextPage
        ? serverPages[serverPages.length - 1]?.nextCursor
        : undefined;
    const pageLoading = reportPagesQuery.isPending || reportPagesQuery.isFetchingNextPage;
    const pageError = reportPagesQuery.error instanceof Error ? reportPagesQuery.error.message : '';

    const matchingRecords = usesServerPaging ? serverRecords : browserMatchingRecords;
    const totalRecords = usesServerPaging ? serverTotal : browserMatchingRecords.length;
    const visibleRecords = usesServerPaging
        ? matchingRecords
        : matchingRecords.slice(0, visibleCount);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (
            !sentinel ||
            pageLoading ||
            (usesServerPaging ? !nextCursor : visibleCount >= matchingRecords.length) ||
            typeof IntersectionObserver === 'undefined'
        ) {
            return undefined;
        }
        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) return;
                if (usesServerPaging) {
                    void reportPagesQuery.fetchNextPage();
                } else {
                    setVisibleCount((current) =>
                        Math.min(matchingRecords.length, current + pageSize),
                    );
                }
            },
            { rootMargin: '300px' },
        );
        observer.observe(sentinel);
        return () => {
            observer.disconnect();
        };
    }, [
        matchingRecords.length,
        nextCursor,
        pageLoading,
        query,
        reportPagesQuery,
        setVisibleCount,
        usesServerPaging,
        visibleCount,
    ]);

    const loadCompleteResult = async (): Promise<readonly AppRecord[]> => {
        if (!usesServerPaging) return browserMatchingRecords;
        const complete: AppRecord[] = [];
        let cursor: string | undefined;
        do {
            const page = await requestReportPage({ ...query, ...(cursor ? { cursor } : {}) });
            complete.push(...page.rows);
            cursor = page.nextCursor;
        } while (cursor);
        return complete;
    };

    const canPrintRecords =
        totalRecords > 0 &&
        !trialExpired &&
        status !== 'Draft' &&
        (usesServerPaging ||
            matchingRecords.some(
                (record) => record.status === 'Finalized' || record.status === 'Cancelled',
            ));

    return {
        canPrintRecords,
        loadCompleteResult,
        matchingRecords,
        nextCursor,
        pageError,
        pageLoading,
        printSource,
        sentinelRef,
        serverRecords,
        setNextCursor: () => undefined,
        setPageError: () => undefined,
        setServerRecords: () => undefined,
        setServerTotal: () => undefined,
        setTask,
        setPrintSource,
        task,
        totalRecords,
        trialExpired,
        usesServerPaging,
        visibleRecords,
    } as const;
};
