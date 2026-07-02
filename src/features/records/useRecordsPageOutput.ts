/** @format */

import { useMutation } from '@tanstack/react-query';

import {
    cancelRuntimeOutput,
    downloadPdfOutput,
    runPrintHtmlOutput,
} from '../../query/RuntimeQueries';
import type { WorkspaceSettings } from '../../runtime/WorkspaceSettings';
import { renderRecordHtml, type RecordPrintPackage } from './RecordPrintHtml';
import type { OutputTask } from './RecordsPageOutputTypes';
import type { AppRecord, EditableRecord } from './RecordStoreContext';

type OutputState = {
    readonly actionState: 'New' | 'DraftDirty' | 'DraftSaved' | 'Finalized' | 'Reprint';
    readonly activePrintPackage: RecordPrintPackage | undefined;
    readonly capabilities: {
        readonly isHostedWeb: boolean;
    };
    readonly outputTask: OutputTask | undefined;
    readonly outputTarget: string;
    readonly preferredPrinterName: string;
    readonly record: EditableRecord;
    readonly selectedStoredRecord: AppRecord | undefined;
    readonly setNotice: (value: string) => void;
    readonly setOutputTask: (value: OutputTask | undefined) => void;
    readonly workspaceSettings: Pick<WorkspaceSettings, 'companyName' | 'address' | 'gstin'>;
};

/** Handles record printing, export, and output cancellation. */
export const useRecordsPageOutput = (state: OutputState) => {
    const printHtmlMutation = useMutation({
        mutationFn: ({
            html,
            jobId,
            printerName,
        }: {
            readonly html: string;
            readonly jobId: string;
            readonly printerName?: string;
        }) =>
            runPrintHtmlOutput({
                capabilities: state.capabilities,
                html,
                jobId,
                ...(printerName ? { printerName } : {}),
            }),
    });
    const downloadPdfMutation = useMutation({
        mutationFn: ({
            fileName,
            html,
            jobId,
        }: {
            readonly fileName: string;
            readonly html: string;
            readonly jobId: string;
        }) =>
            downloadPdfOutput({
                fileName,
                html,
                jobId,
            }),
    });
    const cancelOutputMutation = useMutation({
        mutationFn: (jobId: string) =>
            cancelRuntimeOutput({
                capabilities: state.capabilities,
                jobId,
            }),
    });

    const focusAction = (actionId: string) => {
        window.setTimeout(() => {
            document.querySelector<HTMLButtonElement>(`[data-action-id="${actionId}"]`)?.focus();
        }, 0);
    };

    const printCurrentRecord = (kind: 'Draft Print' | 'Print' | 'Reprint') => {
        const jobId = crypto.randomUUID();
        const title = `${kind} document`;
        state.setOutputTask({
            jobId,
            title,
            completed: 0,
            total: 1,
            message: 'Preparing the document and output device.',
            state: 'Running',
        });
        const runOutput = async () => {
            const html = renderRecordHtml(
                state.record,
                state.selectedStoredRecord,
                state.activePrintPackage,
                state.workspaceSettings,
            );
            if (window.vaultBillDesktop && state.outputTarget === 'DownloadPdf') {
                await downloadPdfMutation.mutateAsync({
                    fileName: state.selectedStoredRecord?.documentNumber ?? 'vaultbill-draft',
                    html,
                    jobId,
                });
                return;
            }
            await printHtmlMutation.mutateAsync({
                html,
                jobId,
                ...(state.preferredPrinterName ? { printerName: state.preferredPrinterName } : {}),
            });
        };
        void runOutput()
            .then(() => {
                state.setOutputTask({
                    jobId,
                    title,
                    completed: 1,
                    total: 1,
                    message: `${kind} completed successfully.`,
                    state: 'Complete',
                });
                state.setNotice(
                    `${kind} completed using the configured ${state.outputTarget} output profile.`,
                );
                focusAction(
                    kind === 'Draft Print'
                        ? 'finalize'
                        : state.actionState === 'Reprint'
                          ? 'reprint'
                          : 'print',
                );
            })
            .catch((reason: unknown) => {
                state.setOutputTask({
                    jobId,
                    title,
                    completed: 0,
                    total: 1,
                    message: reason instanceof Error ? reason.message : 'Output failed.',
                    state: 'Failed',
                });
            });
    };

    const cancelOutput = () => {
        const currentTask = state.outputTask;
        if (!currentTask) return;
        void cancelOutputMutation.mutateAsync(currentTask.jobId).finally(() => {
            state.setOutputTask({
                ...currentTask,
                message: 'Output cancelled before completion.',
                state: 'Cancelled',
            });
        });
    };

    const closeOutput = () => {
        if (state.outputTask?.state !== 'Running') state.setOutputTask(undefined);
    };

    return { cancelOutput, closeOutput, printCurrentRecord };
};
