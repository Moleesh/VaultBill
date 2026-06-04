import type {
  PrintOutputPlan,
  PrintOutputTarget,
  PrintPlatform,
} from './PrintWorkflowTypes';
import type { PrintCompileWarning } from './PrintTemplateTypes';

export const buildPrintOutputPlan = (
  target: PrintOutputTarget,
  platform: PrintPlatform,
  requestedCopies: number | undefined,
  warnings: PrintCompileWarning[],
  printerName?: string,
): PrintOutputPlan => {
  if (target === 'DownloadPdf') {
    const pdfMode =
      platform === 'DesktopElectron' ? 'DesktopGenerated' : 'BrowserSaveAsPdf';

    if (pdfMode === 'BrowserSaveAsPdf') {
      warnings.push({
        kind: 'OutputCapabilityWarning',
        placeholder: 'DownloadPdf',
        message:
          'Web PDF uses browser print preview; choose Save as PDF in the browser dialog.',
      });
    }

    return {
      target,
      label: 'Download as PDF',
      copyCount: 1,
      pdfMode,
    };
  }

  if (target === 'Printer') {
    const plan: PrintOutputPlan = {
      target,
      label: 'Print',
      copyCount: Math.max(1, requestedCopies ?? 1),
      pdfMode: 'NotApplicable',
    };

    return printerName ? { ...plan, printerName } : plan;
  }

  return {
    target,
    label: 'Preview',
    copyCount: 1,
    pdfMode: 'NotApplicable',
  };
};
