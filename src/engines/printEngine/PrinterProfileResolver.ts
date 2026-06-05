import type {
  PrinterOutputTarget,
  PrinterProfileConfig,
  PrinterSummary,
  ResolvedPrinterProfile,
} from './PrinterProfileTypes';
import type { PrintPlatform } from './PrintWorkflowTypes';

export const resolvePrinterProfile = (
  profile: PrinterProfileConfig,
  platform: PrintPlatform,
  availablePrinters: readonly PrinterSummary[],
): ResolvedPrinterProfile => {
  const target = profile.OutputTarget;

  if (target === 'SelectedPrinter') {
    return resolveSelectedPrinter(profile, platform, availablePrinters);
  }

  if (target === 'SystemDefaultPrinter') {
    return resolveSystemDefaultPrinter(profile, platform, availablePrinters);
  }

  if (target === 'AskEveryTime') {
    return enableProfile('Printer', getPrinterCopyCount(profile));
  }

  if (target === 'DownloadPdf') {
    return enableProfile('DownloadPdf', 1);
  }

  return enableProfile('PreviewOnly', 1);
};

export const isPrinterOutputTarget = (target: PrinterOutputTarget): boolean =>
  target === 'SelectedPrinter' || target === 'SystemDefaultPrinter' || target === 'AskEveryTime';

const resolveSelectedPrinter = (
  profile: PrinterProfileConfig,
  platform: PrintPlatform,
  availablePrinters: readonly PrinterSummary[],
): ResolvedPrinterProfile => {
  if (platform !== 'DesktopElectron') {
    return disableProfile('Printer', 'Selected printer output is available only on desktop.');
  }

  if (!profile.PrinterName) {
    return disableProfile('Printer', 'Selected printer profile has no printer name.');
  }

  const printer = availablePrinters.find((candidate) => candidate.name === profile.PrinterName);

  return printer
    ? enableProfile('Printer', getPrinterCopyCount(profile), printer.name)
    : disableProfile('Printer', 'Selected printer is unavailable.');
};

const resolveSystemDefaultPrinter = (
  profile: PrinterProfileConfig,
  platform: PrintPlatform,
  availablePrinters: readonly PrinterSummary[],
): ResolvedPrinterProfile => {
  if (platform !== 'DesktopElectron') {
    return enableProfile('Printer', getPrinterCopyCount(profile));
  }

  const defaultPrinter = availablePrinters.find((printer) => printer.isDefault);

  return defaultPrinter
    ? enableProfile('Printer', getPrinterCopyCount(profile), defaultPrinter.name)
    : enableProfile('Printer', getPrinterCopyCount(profile));
};

const getPrinterCopyCount = (profile: PrinterProfileConfig): number =>
  isPrinterOutputTarget(profile.OutputTarget) ? Math.max(1, profile.DefaultCopies) : 1;

const enableProfile = (
  workflowTarget: ResolvedPrinterProfile['workflowTarget'],
  copyCount: number,
  printerName?: string,
): ResolvedPrinterProfile =>
  printerName
    ? { isEnabled: true, workflowTarget, copyCount, printerName }
    : { isEnabled: true, workflowTarget, copyCount };

const disableProfile = (
  workflowTarget: ResolvedPrinterProfile['workflowTarget'],
  tooltip: string,
): ResolvedPrinterProfile => ({
  isEnabled: false,
  workflowTarget,
  copyCount: 1,
  tooltip,
});
