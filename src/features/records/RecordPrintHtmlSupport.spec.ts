/** @format */

/**
 * Verifies the record print template helpers that format placeholders for both
 * browser printing and the desktop host.
 */

import { afterEach, describe, expect, it } from 'vitest';

import { calculateRecordTotals } from './RecordTotals';
import {
    extractDocumentFragment,
    readBusinessProfile,
    recordFieldValue,
} from './RecordPrintHtmlSupport';

afterEach(() => {
    window.localStorage.clear();
});

describe('RecordPrintHtmlSupport', () => {
    it('reads business profile data and resolves print placeholders', () => {
        window.localStorage.setItem(
            'vaultbill.business-profile',
            JSON.stringify({ companyName: 'VaultBill', address: 'Chennai' }),
        );
        window.localStorage.setItem('vaultbill.company-gstin', '33ABCDE1234F1Z5');

        const record = {
            recordId: 'record-1',
            invoiceDate: '2026-06-01',
            customerName: 'Acme',
            gstin: 'GST-1',
            state: 'TN',
            billingAddress: 'Billing street',
            lineItems: [
                {
                    rowId: 'row-1',
                    itemName: 'Item',
                    hsnSac: 'HSN1',
                    quantity: '2',
                    rate: '10',
                    taxPercent: '18',
                    amount: '20.00',
                    values: { ExtraField: 'Extra value' },
                },
            ],
            grandTotal: '20.00',
            fieldValues: { CustomField: 'Custom value' },
        } as never;

        expect(readBusinessProfile()).toEqual({
            companyName: 'VaultBill',
            address: 'Chennai',
            gstin: '33ABCDE1234F1Z5',
        });
        expect(recordFieldValue('CustomerName', record)).toBe('Acme');
        expect(recordFieldValue('Amount', record)).toBe('20.00');
        expect(recordFieldValue('CustomField', record)).toBe('Custom value');
        expect(recordFieldValue('ExtraField', record)).toBe('Extra value');
        expect(calculateRecordTotals(record)).toMatchObject({ grandTotal: '20.00' });
    });

    it('extracts the printable fragment from a document wrapper', () => {
        const html = `<!doctype html><html><head><style>.a{color:red;}</style></head><body><main>Hello</main></body></html>`;

        expect(extractDocumentFragment(html)).toContain('<style>.a{color:red;}</style>');
        expect(extractDocumentFragment(html)).toContain('<main>Hello</main>');
    });
});
