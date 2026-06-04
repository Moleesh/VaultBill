import { z } from 'zod';

import type { DocumentRecord } from '../../features/records/DocumentRecordSchema';
import type {
  PrintCompileWarning,
  PrintTemplateAsset,
  PrintTemplateRecord,
} from './PrintTemplateTypes';

export const PrintActionSchema = z.enum([
  'DraftPrint',
  'FinalPrint',
  'Reprint',
  'TestPrint',
]);

export const PrintOutputTargetSchema = z.enum([
  'PreviewOnly',
  'DownloadPdf',
  'Printer',
]);

export const PrintPlatformSchema = z.enum(['DesktopElectron', 'LanBrowser', 'Web']);

export type PrintAction = z.infer<typeof PrintActionSchema>;
export type PrintOutputTarget = z.infer<typeof PrintOutputTargetSchema>;
export type PrintPlatform = z.infer<typeof PrintPlatformSchema>;

export type PreparePrintJobInput = {
  readonly action: PrintAction;
  readonly outputTarget: PrintOutputTarget;
  readonly platform: PrintPlatform;
  readonly template: PrintTemplateRecord;
  readonly assets: readonly PrintTemplateAsset[];
  readonly record?: DocumentRecord;
  readonly companyProfile?: Readonly<Record<string, unknown>>;
  readonly printerName?: string;
  readonly requestedCopies?: number;
};

export type PrintOutputPlan = {
  readonly target: PrintOutputTarget;
  readonly label: string;
  readonly copyCount: number;
  readonly pdfMode: 'DesktopGenerated' | 'BrowserSaveAsPdf' | 'NotApplicable';
  readonly printerName?: string;
};

export type PreparedPrintJob = {
  readonly action: PrintAction;
  readonly html: string;
  readonly outputPlan: PrintOutputPlan;
  readonly warnings: readonly PrintCompileWarning[];
};
