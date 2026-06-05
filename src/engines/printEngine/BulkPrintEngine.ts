import { preparePrintJobFromProfile } from './PrintProfileWorkflow';
import type {
  BulkPrintProgress,
  PrepareBulkPrintInput,
  PreparedBulkPrintJob,
} from './BulkPrintTypes';

export const prepareBulkPrint = (input: PrepareBulkPrintInput): PreparedBulkPrintJob => {
  if (input.records.length === 0) {
    return {
      source: input.source,
      outputMode: input.outputMode,
      status: 'Empty',
      totalRecords: 0,
      jobs: [],
      warnings: ['No records match the bulk print request.'],
    };
  }

  const profile = withBulkOutputTarget(input);
  const jobs = input.records.map((record) =>
    preparePrintJobFromProfile({
      action: input.action,
      platform: input.platform,
      template: input.template,
      assets: input.assets,
      record,
      printerProfile: profile,
      availablePrinters: input.availablePrinters,
    }),
  );

  return {
    source: input.source,
    outputMode: input.outputMode,
    status: 'Ready',
    totalRecords: jobs.length,
    jobs,
    ...(input.outputMode === 'CombinedPdf'
      ? { combinedHtml: combinePrintHtml(jobs.map((job) => job.html)) }
      : {}),
    warnings: jobs.flatMap((job) => job.warnings.map((warning) => warning.message)),
  };
};

export const getBulkPrintProgress = (completed: number, total: number): BulkPrintProgress => {
  if (total <= 0) {
    return { completed: 0, total: 0, percent: 0, state: 'Idle' };
  }

  const boundedCompleted = Math.min(Math.max(completed, 0), total);
  const percent = Math.round((boundedCompleted / total) * 100);

  return {
    completed: boundedCompleted,
    total,
    percent,
    state: boundedCompleted === total ? 'Complete' : 'Running',
  };
};

const withBulkOutputTarget = (input: PrepareBulkPrintInput) => {
  if (input.outputMode === 'PrinterEachDocument') {
    return input.printerProfile;
  }

  return {
    ...input.printerProfile,
    OutputTarget: 'DownloadPdf' as const,
    DefaultCopies: 1,
  };
};

const combinePrintHtml = (htmlDocuments: readonly string[]): string =>
  htmlDocuments
    .map(
      (html, index) =>
        `<section class="vaultbill-print-page" data-page="${String(index + 1)}">${html}</section>`,
    )
    .join('<div style="page-break-after: always;"></div>');
