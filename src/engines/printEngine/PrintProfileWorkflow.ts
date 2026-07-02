/** @format */

import { resolvePrinterProfile } from './PrinterProfileResolver';
import type { PrinterProfileConfig, PrinterSummary } from './PrinterProfileTypes';
import { preparePrintJob } from './PrintWorkflow';
import type { PreparedPrintJob, PreparePrintJobInput } from './PrintWorkflowTypes';

export type PrepareProfilePrintJobInput = Omit<
    PreparePrintJobInput,
    'outputTarget' | 'requestedCopies' | 'printerName'
> & {
    readonly printerProfile: PrinterProfileConfig;
    readonly availablePrinters: readonly PrinterSummary[];
};

export const preparePrintJobFromProfile = (
    input: PrepareProfilePrintJobInput,
): PreparedPrintJob => {
    const profileResolution = resolvePrinterProfile(
        input.printerProfile,
        input.platform,
        input.availablePrinters,
    );

    if (!profileResolution.isEnabled) {
        throw new Error(profileResolution.tooltip ?? 'Printer profile is disabled.');
    }

    return preparePrintJob(
        profileResolution.printerName
            ? {
                  ...input,
                  outputTarget: profileResolution.workflowTarget,
                  requestedCopies: profileResolution.copyCount,
                  printerName: profileResolution.printerName,
              }
            : {
                  ...input,
                  outputTarget: profileResolution.workflowTarget,
                  requestedCopies: profileResolution.copyCount,
              },
    );
};
