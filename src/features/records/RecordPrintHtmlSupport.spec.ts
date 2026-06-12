/** @format */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
    extractDocumentFragment,
    readBusinessProfile,
    recordFieldValue,
} from './RecordPrintHtmlSupport';
import type { EditableRecord } from './RecordStoreContext';

const record: EditableRecord = {
    recordId: 'record-1',
    formatId: 'TaxInvoice',
    formatName: 'GST Invoice',
    invoiceDate: '2026-06-11',
    customerName: 'Acme Traders',
    gstin: '29ABCDE1234F1Z5',
    state: 'Tamil Nadu',
    billingAddress: '12 Market Road',
    lineItems: [
        {
            rowId: 'row-1',
            itemName: 'Sample Service',
            hsnSac: '9983',
            quantity: '2',
            rate: '100.00',
            taxPercent: '18',
            amount: '236.00',
            values: { custom: 'value' },
        },
    ],
    grandTotal: '236.00',
    fieldValues: { custom: 'value' },
};

describe('record print html support', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    afterEach(() => {
        window.localStorage.clear();
    });

    it('resolves direct, computed, and line-item placeholders', () => {
        expect(recordFieldValue('CustomerName', record)).toBe('Acme Traders');
        expect(recordFieldValue('Subtotal', record)).toBe('200.00');
        expect(recordFieldValue('custom', record)).toBe('value');
        expect(recordFieldValue('ItemName', record)).toBe('Sample Service');
    });

    it('reads the business profile from browser storage', () => {
        window.localStorage.setItem(
            'vaultbill.business-profile',
            JSON.stringify({ companyName: 'VaultBill Demo', address: 'HQ' }),
        );
        window.localStorage.setItem('vaultbill.company-gstin', '29ABCDE1234F1Z5');

        expect(readBusinessProfile()).toEqual({
            companyName: 'VaultBill Demo',
            address: 'HQ',
            gstin: '29ABCDE1234F1Z5',
        });
    });

    it('keeps inline styles while stripping document wrappers', () => {
        const fragment = extractDocumentFragment(
            '<html><head><style>.demo{color:red}</style></head><body><main>Hi</main></body></html>',
        );

        expect(fragment).toContain('<style>.demo{color:red}</style>');
        expect(fragment).toContain('<main>Hi</main>');
    });
});
