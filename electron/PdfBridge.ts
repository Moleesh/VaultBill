import { z } from 'zod';

import { createHiddenHtmlWindow } from './PrintBridge.js';

export const PdfRequestSchema = z.object({
  html: z.string().min(1),
  fileName: z.string().min(1),
});

export type PdfRequest = z.infer<typeof PdfRequestSchema>;

export type PdfResult = {
  readonly success: boolean;
  readonly fileName: string;
  readonly pdfData?: Uint8Array;
  readonly warning?: string;
};

export const renderHtmlToPdf = async (rawRequest: unknown): Promise<PdfResult> => {
  const request = PdfRequestSchema.parse(rawRequest);
  const pdfWindow = await createHiddenHtmlWindow(request.html);

  try {
    const pdfData = await pdfWindow.webContents.printToPDF({
      printBackground: true,
      preferCSSPageSize: true,
    });

    return {
      success: true,
      fileName: sanitizePdfFileName(request.fileName),
      pdfData: new Uint8Array(pdfData),
    };
  } catch (error) {
    return {
      success: false,
      fileName: sanitizePdfFileName(request.fileName),
      warning:
        error instanceof Error ? error.message : 'Electron PDF generation failed.',
    };
  } finally {
    pdfWindow.close();
  }
};

const sanitizePdfFileName = (fileName: string): string => {
  const cleaned = fileName
    .replace(/\.pdf$/i, '')
    .replace(/[^a-z0-9._ -]+/gi, '-')
    .replace(/\s+/g, ' ')
    .trim();

  return `${cleaned || 'vaultbill-document'}.pdf`;
};
