/** @format */

/**
 * Exercises the record-editing helpers that keep document math and required
 * field validation aligned with the form UI.
 */

import { describe, expect, it } from 'vitest';

import { cloneDefault } from '../../../features/builder/BuilderPageSupport';
import {
    applyDocumentCalculations,
    calculateConfiguredLineItem,
    calculateItemAmount,
    createEmptyRecord,
    defaultFieldValue,
    documentFieldValue,
    emptyLineItem,
    firstMissingRequiredField,
    isNumericField,
    knownDocumentFields,
    knownLineFields,
    lineItemFieldValue,
    normalizeId,
    toEditableRecord,
} from '../RecordsPageSupport';

describe('RecordsPageSupport', () => {
    it('builds editable records and normalizes field lookups', () => {
        const empty = emptyLineItem();
        const created = createEmptyRecord();

        expect(empty.amount).toBe('0.00');
        expect(created.formatName).toBe('GST Invoice');
        expect(toEditableRecord({ ...created, customerName: 'Acme' } as never).customerName).toBe(
            'Acme',
        );
        expect(normalizeId('Grand Total!')).toBe('grandtotal');
        expect(knownDocumentFields.has('grandtotal')).toBe(true);
        expect(knownLineFields.has('amount')).toBe(true);
    });

    it('calculates configured items and document totals', () => {
        const config = {
            ...cloneDefault(),
            Fields: [
                {
                    FieldId: 'GrandTotal',
                    Label: 'Grand total',
                    Type: 'Money',
                    Calculated: true,
                    Formula: 'SUMALL(Amount)',
                    Precision: 2,
                } as never,
                {
                    FieldId: 'CustomerName',
                    Label: 'Customer name',
                    Type: 'Text',
                    Required: true,
                } as never,
            ],
            LineItemSections: [
                {
                    ...cloneDefault().LineItemSections[0],
                    Fields: [
                        {
                            FieldId: 'Amount',
                            Label: 'Amount',
                            Type: 'Money',
                            Calculated: true,
                            Formula: 'Quantity * Rate',
                            Precision: 2,
                        } as never,
                    ],
                },
            ],
        };
        const record = {
            ...createEmptyRecord(),
            customerName: 'Acme',
            lineItems: [
                calculateConfiguredLineItem(
                    { ...emptyLineItem(), quantity: '2', rate: '10' },
                    config as never,
                ),
            ],
        };
        const next = applyDocumentCalculations(record, config as never);
        const firstItem = record.lineItems[0];
        const nextItem = next.lineItems[0];
        if (!firstItem || !nextItem) throw new Error('Expected one configured line item.');

        expect(calculateItemAmount(firstItem)).toBe('23.60');
        expect(next.grandTotal).toBe('20.00');
        expect(documentFieldValue(next, 'CustomerName')).toBe('Acme');
        expect(firstMissingRequiredField(next, config as never)).toBeUndefined();
        expect(lineItemFieldValue(nextItem, 'Amount')).toBe('20.00');
        expect(defaultFieldValue({ DefaultValue: 25 } as never)).toBe('25');
        expect(isNumericField({ Type: 'Money' } as never)).toBe(true);
    });
});
