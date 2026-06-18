/** @format */

import { useEffect, useRef, useState } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import { requestHostedApi } from '../../runtime/HostedApi';
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
    const [serverRecords, setServerRecords] = useState<readonly AppRecord[]>([]);
    const [serverTotal, setServerTotal] = useState(0);
    const [nextCursor, setNextCursor] = useState<string>();
    const [pageLoading, setPageLoading] = useState(false);
    const [pageError, setPageError] = useState('');
    const [task, setTask] = useState<PrintTask>();
    const [printSource, setPrintSource] = useState<readonly AppRecord[]>([]);
    const [trialExpired, setTrialExpired] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const usesServerPaging =
        !capabilities.isDemoMode &&
        (window.vaultBillDesktop !== undefined || capabilities.isLanBrowser);

    const matchingRecords = usesServerPaging ? serverRecords : browserMatchingRecords;
    const totalRecords = usesServerPaging ? serverTotal : browserMatchingRecords.length;
    const visibleRecords = usesServerPaging
        ? matchingRecords
        : matchingRecords.slice(0, visibleCount);

    useEffect(() => {
        if (window.vaultBillDesktop) {
            void window.vaultBillDesktop.getTrialStatus().then((trial) => {
                setTrialExpired(trial.isExpired);
            });
        } else if (capabilities.isLanBrowser) {
            void requestHostedApi<{ readonly isExpired: boolean }>('/trial/status').then(
                (trial) => {
                    setTrialExpired(trial.isExpired);
                },
            );
        }
    }, [capabilities.isLanBrowser]);

    useEffect(() => {
        if (!usesServerPaging) return undefined;
        let active = true;
        setPageLoading(true);
        setPageError('');
        void requestReportPage(query)
            .then((page) => {
                if (!active) return;
                setServerRecords(page.rows);
                setServerTotal(page.total);
                setNextCursor(page.nextCursor);
            })
            .catch((reason: unknown) => {
                if (active) {
                    setPageError(
                        reason instanceof Error
                            ? reason.message
                            : 'Report data could not be loaded.',
                    );
                }
            })
            .finally(() => {
                if (active) setPageLoading(false);
            });
        return () => {
            active = false;
        };
    }, [query, usesServerPaging]);

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
                if (usesServerPaging && nextCursor) {
                    setPageLoading(true);
                    void requestReportPage({ ...query, cursor: nextCursor })
                        .then((page) => {
                            setServerRecords((current) => [
                                ...current,
                                ...page.rows.filter(
                                    (record) =>
                                        !current.some(
                                            (candidate) => candidate.recordId === record.recordId,
                                        ),
                                ),
                            ]);
                            setServerTotal(page.total);
                            setNextCursor(page.nextCursor);
                        })
                        .catch((reason: unknown) => {
                            setPageError(
                                reason instanceof Error
                                    ? reason.message
                                    : 'More report rows could not be loaded.',
                            );
                        })
                        .finally(() => {
                            setPageLoading(false);
                        });
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
        setNextCursor,
        setPageError,
        setServerRecords,
        setServerTotal,
        setTask,
        setPrintSource,
        setTrialExpired,
        task,
        totalRecords,
        trialExpired,
        usesServerPaging,
        visibleRecords,
    } as const;
};
