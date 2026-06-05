import { BrowserWindow } from 'electron';
import { z } from 'zod';

export const PrintRequestSchema = z.object({
  html: z.string().min(1),
  printerName: z.string().min(1).optional(),
  copies: z.number().int().positive().max(99).optional(),
  silent: z.boolean().optional(),
});

export type PrintRequest = z.infer<typeof PrintRequestSchema>;

export type PrintResult = {
  readonly success: boolean;
  readonly warning?: string;
};

export const printHtmlWithElectron = async (rawRequest: unknown): Promise<PrintResult> => {
  const request = PrintRequestSchema.parse(rawRequest);
  const printWindow = await createHiddenHtmlWindow(request.html);

  try {
    await printHtmlWindow(printWindow, request);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      warning: error instanceof Error ? error.message : 'Electron print failed.',
    };
  } finally {
    printWindow.close();
  }
};

export const createHiddenHtmlWindow = async (html: string): Promise<BrowserWindow> => {
  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  return printWindow;
};

const buildPrintOptions = (request: PrintRequest): Electron.WebContentsPrintOptions => {
  const options: Electron.WebContentsPrintOptions = {
    silent: request.silent ?? false,
    printBackground: true,
    copies: request.copies ?? 1,
  };

  if (request.printerName) {
    options.deviceName = request.printerName;
  }

  return options;
};

const printHtmlWindow = (printWindow: BrowserWindow, request: PrintRequest): Promise<void> =>
  new Promise((resolve, reject) => {
    printWindow.webContents.print(buildPrintOptions(request), (success, failureReason) => {
      if (success) {
        resolve();
        return;
      }

      reject(new Error(failureReason || 'Electron print failed.'));
    });
  });
