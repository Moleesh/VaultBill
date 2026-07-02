/** @format */

import { describe, expect, it } from 'vitest';

import type { EditableRecord } from '../RecordStoreContext';
import { calculateRecordTotals } from '../RecordTotals';

const record: EditableRecord = {
    recordId: 'record-1',
    formatId: 'TaxInvoice',
    formatName: 'GST Invoice',
    invoiceDate: '2026-06-07',
    customerName: 'Sample Customer',
    gstin: '',
    state: '',
    billingAddress: 'Main Road',
    lineItems: [
        {
            rowId: 'row-1',
            itemName: 'Sample service',
            hsnSac: '9983',
            quantity: '1',
            rate: '100.00',
            taxPercent: '18',
            amount: '118.00',
            values: {},
        },
    ],
    grandTotal: '118.00',
    fieldValues: {},
};

describe('calculateRecordTotals', () => {
    it('derives subtotal, tax, round off, and grand total from line items', () => {
        expect(calculateRecordTotals(record)).toEqual({
            subtotal: '100.00',
            taxTotal: '18.00',
            roundOff: '0.00',
            grandTotal: '118.00',
        });
    });
});
