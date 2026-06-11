/** @format */

import type { BrowserWindow } from 'electron';

export type PrinterSummary = {
    readonly id: string;
    readonly name: string;
    readonly isDefault: boolean;
};

export const listElectronPrinters = async (
    browserWindow: BrowserWindow,
): Promise<readonly PrinterSummary[]> => {
    const printers = await browserWindow.webContents.getPrintersAsync();

    return printers.map((printer) => ({
        id: printer.name,
        name: printer.name,
        isDefault: false,
    }));
};
