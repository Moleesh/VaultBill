/** @format */

import type { EditableRecord } from './RecordStoreContext';
import { calculateRecordTotals } from './RecordTotals';

/**
 * Resolves a print placeholder field value from the record, computed totals,
 * or line-item values.
 */
export const recordFieldValue = (fieldId: string, record: EditableRecord): string => {
    const normalized = fieldId.toLocaleLowerCase();
    const totals = calculateRecordTotals(record);
    const directValues: Readonly<Record<string, string>> = {
        invoicedate: record.invoiceDate,
        customername: record.customerName,
        customergstin: record.gstin,
        gstin: record.gstin,
        state: record.state,
        billingaddress: record.billingAddress,
        subtotal: totals.subtotal,
        taxtotal: totals.taxTotal,
        roundoff: totals.roundOff,
        grandtotal: totals.grandTotal,
    };
    if (directValues[normalized] !== undefined) return directValues[normalized];
    const customValue = record.fieldValues?.[fieldId];
    if (customValue !== undefined) return customValue;
    const lineItemValues: Readonly<Record<string, string>> = {
        itemname: record.lineItems.map((item) => item.itemName).join(', '),
        hsnsac: record.lineItems.map((item) => item.hsnSac).join(', '),
        quantity: record.lineItems.map((item) => item.quantity).join(', '),
        rate: record.lineItems.map((item) => item.rate).join(', '),
        taxpercent: record.lineItems.map((item) => item.taxPercent).join(', '),
        amount: record.lineItems.map((item) => item.amount).join(', '),
    };
    return (
        lineItemValues[normalized] ??
        record.lineItems
            .map((item) => item.values?.[fieldId] ?? '')
            .filter(Boolean)
            .join(', ')
    );
};

/** Reads the business profile used by print templates from browser storage. */
export const readBusinessProfile = (): {
    readonly companyName: string;
    readonly address: string;
    readonly gstin: string;
} => {
    try {
        const profile = JSON.parse(
            window.localStorage.getItem('vaultbill.business-profile') ?? '{}',
        ) as { companyName?: unknown; address?: unknown };
        return {
            companyName: typeof profile.companyName === 'string' ? profile.companyName : '',
            address: typeof profile.address === 'string' ? profile.address : '',
            gstin: window.localStorage.getItem('vaultbill.company-gstin') ?? '',
        };
    } catch {
        return { companyName: '', address: '', gstin: '' };
    }
};

/** Strips the document wrapper while preserving inline styles for print output. */
export const extractDocumentFragment = (document: string): string => {
    const styles = [...document.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/giu)]
        .map((match) => `<style>${match[1] ?? ''}</style>`)
        .join('');
    const body = /<body\b[^>]*>([\s\S]*?)<\/body>/iu.exec(document)?.[1] ?? document;
    return `${styles}${body
        .replace(/<!doctype[^>]*>/giu, '')
        .replace(/<\/?(?:html|head|body)\b[^>]*>/giu, '')}`;
};
