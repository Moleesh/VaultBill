import { z } from 'zod';

import type { PrintOutputTarget } from './PrintWorkflowTypes';

export const PrinterOutputTargetSchema = z.enum([
  'SelectedPrinter',
  'SystemDefaultPrinter',
  'AskEveryTime',
  'DownloadPdf',
  'PreviewOnly',
]);

export const PrinterProfileConfigSchema = z
  .object({
    ProfileId: z.string().min(1),
    ProfileName: z.string().min(1),
    OutputTarget: PrinterOutputTargetSchema,
    PrinterName: z.string().optional(),
    PaperSize: z.string().min(1),
    Orientation: z.enum(['Portrait', 'Landscape']),
    Margins: z.object({
      Top: z.number().nonnegative(),
      Right: z.number().nonnegative(),
      Bottom: z.number().nonnegative(),
      Left: z.number().nonnegative(),
    }),
    Scale: z.number().positive(),
    ShowPreviewBeforePrint: z.boolean(),
    AskCopiesBeforePrint: z.boolean(),
    DefaultCopies: z.number().int().positive(),
    FirstPageOnly: z.boolean(),
  })
  .passthrough();

export type PrinterOutputTarget = z.infer<typeof PrinterOutputTargetSchema>;
export type PrinterProfileConfig = z.infer<typeof PrinterProfileConfigSchema>;

export type PrinterSummary = {
  readonly id: string;
  readonly name: string;
  readonly isDefault: boolean;
};

export type PrinterProfileRecord = {
  readonly profileId: string;
  readonly profileName: string;
  readonly profileConfig: PrinterProfileConfig;
  readonly isDefault: boolean;
  readonly updatedAt: string;
};

export type ResolvedPrinterProfile = {
  readonly isEnabled: boolean;
  readonly workflowTarget: PrintOutputTarget;
  readonly copyCount: number;
  readonly printerName?: string;
  readonly tooltip?: string;
};
