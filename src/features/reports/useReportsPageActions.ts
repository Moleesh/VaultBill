/** @format */

import { useMutation } from '@tanstack/react-query';

import { runPrintHtmlOutput } from '../../query/RuntimeQueries';
import { combineRecordHtml } from '../records/RecordPrintHtml';
import type { AppRecord } from '../records/RecordStoreSupport';
import { buildReportCsv, renderReportHtml } from './ReportsPageRenderingSupport';
import { loadPrintPackages, printBatchSize } from './ReportsPageSupport';
import type { ReportsPageActionInput } from './ReportsPageTypes';

export const useReportsPageActions = (input: ReportsPageActionInput) => {
    const printOutputMutation = useMutation({
        mutationFn: ({ html, jobId }: { readonly html: string; readonly jobId: string }) =>
            runPrintHtmlOutput({
                capabilities: input.capabilities,
                html,
                jobId,
            }),
    });

    const exportAll = () => {
        input.setTask({
            kind: 'report',
            completed: 0,
            total: input.totalRecords,
            running: true,
            message: 'Loading the complete filtered result for export.',
        });
        void input
            .loadCompleteResult()
            .then((completeRecords) => {
                const csv = buildReportCsv(input.reportId, completeRecords);
                const url = URL.createObjectURL(
                    new Blob([csv], { type: 'text/csv;charset=utf-8' }),
                );
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = `${input.reportId}-${new Date().toISOString().slice(0, 10)}.csv`;
                anchor.click();
                URL.revokeObjectURL(url);
                input.setTask({
                    kind: 'report',
                    completed: completeRecords.length,
                    total: completeRecords.length,
                    running: false,
                    message: 'Export completed.',
                });
            })
            .catch((reason: unknown) => {
                input.setTask({
                    kind: 'report',
                    completed: 0,
                    total: input.totalRecords,
                    running: false,
                    message: reason instanceof Error ? reason.message : 'Export failed.',
                });
            });
    };

    const runReportPrint = () => {
        const jobId = crypto.randomUUID();
        input.setTask({
            kind: 'report',
            completed: 0,
            total: input.totalRecords,
            jobId,
            running: true,
            message: 'Preparing the complete filtered report.',
        });
        void input
            .loadCompleteResult()
            .then(async (completeRecords) => {
                await printOutputMutation.mutateAsync({
                    html: renderReportHtml(input.reportId, completeRecords),
                    jobId,
                });
                return completeRecords;
            })
            .then((completeRecords) => {
                input.setTask({
                    kind: 'report',
                    completed: completeRecords.length,
                    total: completeRecords.length,
                    running: false,
                    message: 'Report printing completed.',
                });
            })
            .catch((reason: unknown) => {
                input.setTask({
                    kind: 'report',
                    completed: 0,
                    total: input.totalRecords,
                    running: false,
                    message: reason instanceof Error ? reason.message : 'Report printing failed.',
                });
            });
    };

    const runNextRecordBatch = (startAt = 0, suppliedRecords?: readonly AppRecord[]) => {
        const prepare =
            suppliedRecords ??
            (startAt > 0 && input.printSource.length > 0 ? input.printSource : undefined);
        void (prepare ? Promise.resolve(prepare) : input.loadCompleteResult())
            .then((completeRecords) => {
                const printable = completeRecords.filter(
                    (record) => record.status === 'Finalized' || record.status === 'Cancelled',
                );
                if (printable.length === 0)
                    throw new Error('No finalized or cancelled records match.');
                input.setPrintSource(printable);
                const nextCompleted = Math.min(printable.length, startAt + printBatchSize);
                const batch = printable.slice(startAt, nextCompleted);
                const jobId = crypto.randomUUID();
                input.setTask({
                    kind: 'records',
                    completed: startAt,
                    total: printable.length,
                    jobId,
                    running: true,
                    message: `Printing records ${String(startAt + 1)}-${String(nextCompleted)} in report order.`,
                });
                return loadPrintPackages(batch, input.capabilities.isHostedWeb)
                    .then((packages) =>
                        printOutputMutation.mutateAsync({
                            html: combineRecordHtml(batch, packages, input.workspaceSettings),
                            jobId,
                        }),
                    )
                    .then(() => ({ nextCompleted, printable }));
            })
            .then(({ nextCompleted, printable }) => {
                input.setTask({
                    kind: 'records',
                    completed: nextCompleted,
                    total: printable.length,
                    awaitingContinue: nextCompleted < printable.length,
                    running: false,
                    message:
                        nextCompleted < printable.length
                            ? 'This batch completed. Continue with the next records?'
                            : 'All matching records printed.',
                });
                if (nextCompleted >= printable.length) input.setPrintSource([]);
            })
            .catch((reason: unknown) => {
                input.setTask({
                    kind: 'records',
                    completed: startAt,
                    total: input.totalRecords,
                    running: false,
                    message: reason instanceof Error ? reason.message : 'Record printing failed.',
                });
            });
    };

    return { exportAll, runNextRecordBatch, runReportPrint } as const;
};
