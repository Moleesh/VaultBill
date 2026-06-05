import type { DocumentRecord } from '../../features/records/DocumentRecordSchema';
import type { PrinterProfileConfig, PrinterSummary } from './PrinterProfileTypes';
import type { PreparedPrintJob, PrintAction, PrintPlatform } from './PrintWorkflowTypes';
import type { PrintTemplateAsset, PrintTemplateRecord } from './PrintTemplateTypes';

export type BulkPrintSource = 'SelectedRecords' | 'FilteredReport';

export type BulkPrintOutputMode = 'CombinedPdf' | 'IndividualPdf' | 'PrinterEachDocument';

export type PrepareBulkPrintInput = {
  readonly source: BulkPrintSource;
  readonly outputMode: BulkPrintOutputMode;
  readonly action: Extract<PrintAction, 'FinalPrint' | 'Reprint'>;
  readonly platform: PrintPlatform;
  readonly records: readonly DocumentRecord[];
  readonly template: PrintTemplateRecord;
  readonly assets: readonly PrintTemplateAsset[];
  readonly printerProfile: PrinterProfileConfig;
  readonly availablePrinters: readonly PrinterSummary[];
};

export type PreparedBulkPrintJob = {
  readonly source: BulkPrintSource;
  readonly outputMode: BulkPrintOutputMode;
  readonly status: 'Empty' | 'Ready';
  readonly totalRecords: number;
  readonly jobs: readonly PreparedPrintJob[];
  readonly combinedHtml?: string;
  readonly warnings: readonly string[];
};

export type BulkPrintProgress = {
  readonly completed: number;
  readonly total: number;
  readonly percent: number;
  readonly state: 'Idle' | 'Running' | 'Complete';
};
