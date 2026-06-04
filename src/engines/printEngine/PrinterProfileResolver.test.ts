import { describe, expect, it } from 'vitest';

import type { PrinterProfileConfig, PrinterSummary } from './PrinterProfileTypes';
import { resolvePrinterProfile } from './PrinterProfileResolver';

const availablePrinters: readonly PrinterSummary[] = [
  { id: 'hp', name: 'HP LaserJet Pro', isDefault: true },
  { id: 'canon', name: 'Canon Office', isDefault: false },
];

const createProfile = (
  overrides: Partial<PrinterProfileConfig> = {},
): PrinterProfileConfig => ({
  ProfileId: 'OfficeA4',
  ProfileName: 'Office A4 Printer',
  OutputTarget: 'SelectedPrinter',
  PrinterName: 'HP LaserJet Pro',
  PaperSize: 'A4',
  Orientation: 'Portrait',
  Margins: { Top: 10, Right: 10, Bottom: 10, Left: 10 },
  Scale: 1,
  ShowPreviewBeforePrint: true,
  AskCopiesBeforePrint: false,
  DefaultCopies: 2,
  FirstPageOnly: true,
  ...overrides,
});

describe('PrinterProfileResolver', () => {
  it('enables selected desktop printers only when the printer is available', () => {
    expect(
      resolvePrinterProfile(createProfile(), 'DesktopElectron', availablePrinters),
    ).toEqual({
      isEnabled: true,
      workflowTarget: 'Printer',
      copyCount: 2,
      printerName: 'HP LaserJet Pro',
    });

    expect(
      resolvePrinterProfile(
        createProfile({ PrinterName: 'Missing Printer' }),
        'DesktopElectron',
        availablePrinters,
      ),
    ).toMatchObject({
      isEnabled: false,
      tooltip: 'Selected printer is unavailable.',
    });
  });

  it('disables exact selected printers outside desktop Electron', () => {
    expect(resolvePrinterProfile(createProfile(), 'Web', [])).toMatchObject({
      isEnabled: false,
      tooltip: 'Selected printer output is available only on desktop.',
    });
  });

  it('resolves system default, ask-every-time, PDF, and preview targets', () => {
    expect(
      resolvePrinterProfile(
        createProfile({ OutputTarget: 'SystemDefaultPrinter' }),
        'DesktopElectron',
        availablePrinters,
      ),
    ).toMatchObject({ workflowTarget: 'Printer', printerName: 'HP LaserJet Pro' });
    expect(
      resolvePrinterProfile(
        createProfile({ OutputTarget: 'SystemDefaultPrinter' }),
        'DesktopElectron',
        [],
      ),
    ).toMatchObject({ isEnabled: true, workflowTarget: 'Printer' });
    expect(
      resolvePrinterProfile(createProfile({ OutputTarget: 'AskEveryTime' }), 'Web', []),
    ).toMatchObject({ isEnabled: true, workflowTarget: 'Printer', copyCount: 2 });
    expect(
      resolvePrinterProfile(createProfile({ OutputTarget: 'DownloadPdf' }), 'Web', []),
    ).toMatchObject({ isEnabled: true, workflowTarget: 'DownloadPdf', copyCount: 1 });
    expect(
      resolvePrinterProfile(createProfile({ OutputTarget: 'PreviewOnly' }), 'Web', []),
    ).toMatchObject({ isEnabled: true, workflowTarget: 'PreviewOnly', copyCount: 1 });
  });
});
