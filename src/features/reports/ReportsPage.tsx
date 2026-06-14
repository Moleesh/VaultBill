/** @format */

/**
 * Reports workspace for filtered queries, infinite loading, and print/export
 * jobs.
 */

import type { FC } from 'react';

import { ReportsActionBar } from './ReportsActionBar';
import { ReportsFilterPanel } from './ReportsFilterPanel';
import { ReportsPrintTaskModal } from './ReportsPrintTaskModal';
import { ReportsResults } from './ReportsResults';
import { useReportsPageController } from './useReportsPageController';
import { requestHostedApi } from '../../runtime/HostedApi';
import type { ReportsPageController } from './ReportsPageTypes';

/** Renders report filters, result loading, and reporting actions. */
export const ReportsPage: FC = () => {
    const controller: ReportsPageController = useReportsPageController();
    const reportError = controller.error !== '' ? controller.error : controller.pageError;

    return (
        <div className="page-stack reports-page">
            <ReportsFilterPanel
                customer={controller.customer}
                customers={controller.customers}
                fromDate={controller.fromDate}
                invoiceNumber={controller.invoiceNumber}
                onReportFieldChange={controller.setReportField}
                onReportFieldValueChange={controller.setReportFieldValue}
                onCustomerChange={controller.setCustomer}
                onFromDateChange={controller.setFromDate}
                onInvoiceNumberChange={controller.setInvoiceNumber}
                onPresetChange={controller.applyPreset}
                onReportIdChange={controller.setReportId}
                onStatusChange={controller.setStatus}
                onToDateChange={controller.setToDate}
                preset={controller.preset}
                reportId={controller.reportId}
                reportField={controller.reportField}
                reportFieldValue={controller.reportFieldValue}
                status={controller.status}
                toDate={controller.toDate}
            />
            <section className="data-panel">
                <ReportsActionBar
                    canExport={controller.totalRecords > 0 && !controller.trialExpired}
                    canPrintRecords={controller.canPrintRecords}
                    canPrintReport={controller.totalRecords > 0 && !controller.trialExpired}
                    customer={controller.customer}
                    fromDate={controller.fromDate}
                    invoiceNumber={controller.invoiceNumber}
                    onClearReportField={() => {
                        controller.setReportField('customerName');
                        controller.setReportFieldValue('');
                    }}
                    preset={controller.preset}
                    onClearCustomer={() => {
                        controller.setCustomer('');
                    }}
                    onClearDateRange={() => {
                        controller.setFromDate('');
                        controller.setToDate('');
                    }}
                    onClearInvoiceNumber={() => {
                        controller.setInvoiceNumber('');
                    }}
                    onClearStatus={() => {
                        controller.setStatus('All');
                    }}
                    onClearPreset={() => {
                        controller.setPreset('All');
                    }}
                    onExportAll={controller.exportAll}
                    onPrintRecords={() => {
                        controller.runNextRecordBatch();
                    }}
                    onPrintReport={controller.runReportPrint}
                    onReset={controller.reset}
                    reportField={controller.reportField}
                    reportFieldValue={controller.reportFieldValue}
                    status={controller.status}
                    toDate={controller.toDate}
                    totalRecords={controller.totalRecords}
                    trialExpired={controller.trialExpired}
                    visibleCount={controller.visibleRecords.length}
                />
                {reportError ? (
                    <div className="feedback-error">
                        <strong>Report data could not be loaded.</strong>
                        <p>{reportError}</p>
                    </div>
                ) : null}
                <ReportsResults
                    isLoading={controller.isLoading}
                    matchingCount={controller.matchingRecords.length}
                    nextCursor={controller.nextCursor}
                    pageLoading={controller.pageLoading}
                    records={controller.visibleRecords}
                    reportId={controller.reportId}
                    sentinelRef={controller.sentinelRef}
                    totalRecords={controller.totalRecords}
                    usesServerPaging={controller.usesServerPaging}
                />
            </section>
            <ReportsPrintTaskModal
                onCancelOutput={() => {
                    if (!controller.task?.running || !controller.task.jobId) {
                        controller.setTask(undefined);
                        return;
                    }
                    const cancel = controller.capabilities.isLanBrowser
                        ? requestHostedApi<{ readonly cancelled: boolean }>(
                              '/print/cancel',
                              'POST',
                              { jobId: controller.task.jobId },
                          )
                        : Promise.resolve(false);
                    void cancel.finally(() => {
                        controller.setTask(undefined);
                    });
                }}
                onClose={() => {
                    controller.setTask(undefined);
                }}
                onContinue={() => {
                    controller.runNextRecordBatch(
                        controller.task?.completed ?? 0,
                        controller.printSource,
                    );
                }}
                task={controller.task}
            />
        </div>
    );
};
