/** @format */

/**
 * Verifies the record print template helpers that resolve placeholders and
 * extract the printable HTML fragment.
 */

import { describe, expect, it } from 'vitest';

import { calculateRecordTotals } from '../RecordTotals';
import { extractDocumentFragment, recordFieldValue } from '../RecordPrintHtmlSupport';

describe('RecordPrintHtmlSupport', () => {
    it('resolves print placeholders from records and line items', () => {
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
