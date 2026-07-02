/** @format */

import type { FC, PropsWithChildren } from 'react';
import { useEffect, useMemo } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useCapabilities } from '../../capability/CapabilityContext';
import { getRuntimeQueryScope, queryKeys } from '../../query/QueryKeys';
import {
    cancelRuntimeRecord,
    fetchStoredRecords,
    finalizeRuntimeRecord,
    saveDraftRuntimeRecord,
} from '../../query/RuntimeQueries';
import { isStaticHostedBrowserBuild } from '../../runtime/RuntimeMode';
import type { OperatorContext } from '../auth/AccountTypes';
import { RecordStoreContext } from './RecordStoreContextBase';
import {
    recordStoreEventName,
    resetBrowserRecords,
    sortLatestFirst,
    writeBrowserRecords,
    type AppRecord,
    type EditableRecord,
} from './RecordStoreSupport';

import { useSession } from '../auth/useSession';

const mergeRecord = (
    currentRecords: readonly AppRecord[],
    nextRecord: AppRecord,
): readonly AppRecord[] =>
    sortLatestFirst([
        nextRecord,
        ...currentRecords.filter((record) => record.recordId !== nextRecord.recordId),
    ]);

/**
 * Supplies record data and record mutations across every runtime mode.
 */
export const RecordStoreProvider: FC<PropsWithChildren> = ({ children }) => {
    const capabilities = useCapabilities();
    const usesStaticHostedBrowserBuild = isStaticHostedBrowserBuild(capabilities);
    const { operatorContext: sessionOperator } = useSession();
    const queryClient = useQueryClient();
    const runtimeScope = getRuntimeQueryScope(capabilities);
    const recordsQueryKey = queryKeys.records(runtimeScope);
    const recordsQuery = useQuery({
        queryKey: recordsQueryKey,
        queryFn: () =>
            fetchStoredRecords({
                capabilities,
                sessionOperator,
                usesStaticHostedBrowserBuild,
            }),
    });
    const records = recordsQuery.data ?? [];
    const error = recordsQuery.error instanceof Error ? recordsQuery.error.message : '';
    const persistBrowserRecordsIfNeeded = (nextRecords: readonly AppRecord[]) => {
        if (
            !window.vaultBillDesktop &&
            !capabilities.isHostedWeb &&
            !usesStaticHostedBrowserBuild
        ) {
            writeBrowserRecords(nextRecords);
        }
    };
    const updateCachedRecords = (
        updater: (currentRecords: readonly AppRecord[]) => readonly AppRecord[],
    ) => {
        queryClient.setQueryData<readonly AppRecord[]>(recordsQueryKey, (currentRecords = []) => {
            const nextRecords = updater(currentRecords);
            persistBrowserRecordsIfNeeded(nextRecords);
            return nextRecords;
        });
        void queryClient.invalidateQueries({
            queryKey: ['runtime', runtimeScope, 'report-results'],
        });
    };
    const saveDraftMutation = useMutation({
        mutationFn: ({
            input,
            operatorContext,
        }: {
            readonly input: EditableRecord;
            readonly operatorContext: OperatorContext;
        }) =>
            saveDraftRuntimeRecord({
                capabilities,
                existing: records.find((record) => record.recordId === input.recordId),
                input,
                operatorContext,
                usesStaticHostedBrowserBuild,
            }),
        onSuccess: (nextRecord) => {
            updateCachedRecords((currentRecords) => mergeRecord(currentRecords, nextRecord));
        },
    });
    const finalizeRecordMutation = useMutation({
        mutationFn: ({
            input,
            operatorContext,
        }: {
            readonly input: EditableRecord;
            readonly operatorContext: OperatorContext;
        }) =>
            finalizeRuntimeRecord({
                capabilities,
                existing: records.find((record) => record.recordId === input.recordId),
                input,
                operatorContext,
                usesStaticHostedBrowserBuild,
            }),
        onSuccess: (nextRecord) => {
            updateCachedRecords((currentRecords) => mergeRecord(currentRecords, nextRecord));
        },
    });
    const cancelRecordMutation = useMutation({
        mutationFn: ({
            operatorContext,
            reason,
            recordId,
        }: {
            readonly operatorContext: OperatorContext;
            readonly reason: string;
            readonly recordId: string;
        }) =>
            cancelRuntimeRecord({
                capabilities,
                existing: records.find((record) => record.recordId === recordId),
                operatorContext,
                reason,
                recordId,
                usesStaticHostedBrowserBuild,
            }),
        onSuccess: (nextRecord) => {
            updateCachedRecords((currentRecords) => mergeRecord(currentRecords, nextRecord));
        },
    });

    useEffect(() => {
        const refreshRecords = () => {
            void queryClient.invalidateQueries({
                queryKey: recordsQueryKey,
            });
        };
        window.addEventListener(recordStoreEventName, refreshRecords);

        return () => {
            window.removeEventListener(recordStoreEventName, refreshRecords);
        };
    }, [queryClient, recordsQueryKey]);

    const actions = useMemo(
        () => ({
            saveDraft: (input: EditableRecord, operatorContext: OperatorContext) =>
                saveDraftMutation.mutateAsync({ input, operatorContext }),
            finalizeRecord: (input: EditableRecord, operatorContext: OperatorContext) =>
                finalizeRecordMutation.mutateAsync({ input, operatorContext }),
            cancelRecord: (recordId: string, reason: string, operatorContext: OperatorContext) =>
                cancelRecordMutation.mutateAsync({ recordId, reason, operatorContext }),
            resetDemoData: () => {
                resetBrowserRecords();
                void queryClient.invalidateQueries({
                    queryKey: recordsQueryKey,
                });
                void queryClient.invalidateQueries({
                    queryKey: ['runtime', runtimeScope, 'report-results'],
                });
            },
        }),
        [
            cancelRecordMutation,
            finalizeRecordMutation,
            queryClient,
            recordsQueryKey,
            runtimeScope,
            saveDraftMutation,
        ],
    );

    return (
        <RecordStoreContext.Provider
            value={{
                records,
                isLoading: recordsQuery.isPending,
                error,
                saveDraft: actions.saveDraft,
                finalizeRecord: actions.finalizeRecord,
                cancelRecord: actions.cancelRecord,
                resetDemoData: actions.resetDemoData,
            }}
        >
            {children}
        </RecordStoreContext.Provider>
    );
};
