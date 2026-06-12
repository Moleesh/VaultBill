/** @format */

import { requestHostedApi } from '../../runtime/HostedApi';
import { renderRecordHtml, type RecordPrintPackage } from './RecordPrintHtml';
import type { AppRecord, EditableRecord } from './RecordStoreContext';
import type { OutputTask } from './RecordsPageOutputTypes';

type OutputState = {
    readonly actionState: 'New' | 'DraftDirty' | 'DraftSaved' | 'Finalized' | 'Reprint';
    readonly activePrintPackage: RecordPrintPackage | undefined;
    readonly capabilities: {
        readonly isLanBrowser: boolean;
    };
    readonly outputTask: OutputTask | undefined;
    readonly outputTarget: string;
    readonly preferredPrinterName: string;
    readonly record: EditableRecord;
    readonly selectedStoredRecord: AppRecord | undefined;
    readonly setNotice: (value: string) => void;
    readonly setOutputTask: (value: OutputTask | undefined) => void;
};

/** Handles record printing, export, and output cancellation. */
export const useRecordsPageOutput = (state: OutputState) => {
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
            );
            if (window.vaultBillDesktop && state.outputTarget === 'DownloadPdf') {
                const result = await window.vaultBillDesktop.downloadPdf({
                    html,
                    fileName: state.selectedStoredRecord?.documentNumber ?? 'vaultbill-draft',
                    jobId,
                });
                if (!result.success || !result.pdfData) {
                    throw new Error(result.warning ?? 'PDF generation failed.');
                }
                const arrayBuffer = new Uint8Array(result.pdfData).buffer;
                const url = URL.createObjectURL(
                    new Blob([arrayBuffer], { type: 'application/pdf' }),
                );
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = result.fileName;
                anchor.click();
                URL.revokeObjectURL(url);
                return;
            }
            if (window.vaultBillDesktop) {
                const result = await window.vaultBillDesktop.printHtml({
                    html,
                    jobId,
                    ...(state.preferredPrinterName
                        ? { printerName: state.preferredPrinterName }
                        : {}),
                });
                if (!result.success) throw new Error(result.warning ?? 'Printing failed.');
                return;
            }
            if (state.capabilities.isLanBrowser) {
                const result = await requestHostedApi<{ success: boolean; warning?: string }>(
                    '/print/html',
                    'POST',
                    { html, jobId },
                );
                if (!result.success) throw new Error(result.warning ?? 'Host printing failed.');
                return;
            }
            window.print();
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
        const cancel = window.vaultBillDesktop
            ? window.vaultBillDesktop.cancelOutput(currentTask.jobId)
            : state.capabilities.isLanBrowser
              ? requestHostedApi('/print/cancel', 'POST', { jobId: currentTask.jobId })
              : Promise.resolve(false);
        void cancel.finally(() => {
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
