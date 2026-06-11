/** @format */

import type { EditableRecord, RecordLineItem } from './RecordStoreContext';

export type RecordTotals = {
    readonly subtotal: string;
    readonly taxTotal: string;
    readonly roundOff: string;
    readonly grandTotal: string;
};

const money = (value: number): string => value.toFixed(2);

const decimal = (value: string | undefined): number => {
    const parsed = Number.parseFloat(value ?? '');
    return Number.isFinite(parsed) ? parsed : 0;
};

const lineSubtotal = (item: RecordLineItem): number => decimal(item.quantity) * decimal(item.rate);

const lineTax = (item: RecordLineItem): number => {
    const subtotal = lineSubtotal(item);
    const taxPercent = decimal(item.taxPercent);
    return subtotal * (taxPercent / 100);
};

export const calculateRecordTotals = (record: EditableRecord): RecordTotals => {
    const subtotal = record.lineItems.reduce((total, item) => total + lineSubtotal(item), 0);
    const taxTotal = record.lineItems.reduce((total, item) => total + lineTax(item), 0);
    const grandTotal = record.lineItems.reduce(
        (total, item) => total + decimal(item.amount || undefined),
        0,
    );
    const roundOff = grandTotal - subtotal - taxTotal;
    return {
        subtotal: money(subtotal),
        taxTotal: money(taxTotal),
        roundOff: money(roundOff),
        grandTotal: money(grandTotal),
    };
};
