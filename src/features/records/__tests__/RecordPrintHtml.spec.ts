/** @format */

import { describe, expect, it } from 'vitest';

import { builtInDefaultFormat } from '../../../db/startup/BuiltInDefaultFormat';
import { combineRecordHtml, renderRecordHtml } from '../RecordPrintHtml';
import type { AppRecord } from '../RecordStoreContext';

const record: AppRecord = {
    recordId: 'record-1',
    formatId: 'TaxInvoice',
    formatName: 'GST Invoice',
    documentNumber: 'GST-000001',
    status: 'Cancelled',
    invoiceDate: '2026-06-07',
    customerName: '<Unsafe Customer>',
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
    createdAt: '2026-06-07T00:00:00.000Z',
    updatedAt: '2026-06-07T00:00:00.000Z',
    createdBy: 'admin_1',
    createdByName: 'Admin',
    cancellationReason: 'Duplicate',
};

describe('record print HTML', () => {
    it('escapes record values and exposes cancelled styling', () => {
        const html = renderRecordHtml(record, record);

        expect(html).toContain('CANCELLED');
        expect(html).toContain('&lt;Unsafe Customer&gt;');
        expect(html).not.toContain('<Unsafe Customer>');
        expect(html).toContain('Subtotal');
        expect(html).toContain('Round off');
    });

    it('keeps bulk records in the supplied deterministic order', () => {
        const second = { ...record, recordId: 'record-2', documentNumber: 'GST-000002' };
        const html = combineRecordHtml([record, second]);

        expect(html.indexOf('GST-000001')).toBeLessThan(html.indexOf('GST-000002'));
    });

    it('resolves published template values, assets, and cancellation fields', () => {
        const html = renderRecordHtml(record, record, {
            config: builtInDefaultFormat,
            templateHtml:
                '<main><img src="{{Asset.Logo}}"><h1>{{Record.Number}}</h1><p>{{Record.CustomerName}}</p><strong>{{Record.CancellationReason}}</strong><span>{{Record.Subtotal}}</span><span>{{Record.TaxTotal}}</span><span>{{Record.RoundOff}}</span><em>{{Record.CreatedByName}}</em><em>{{Record.LastActionByName}}</em>{{Items.Table}}</main>',
            assets: [{ name: 'Logo', type: 'image/png', dataBase64: 'cG5n' }],
        });

        expect(html).toContain('data:image/png;base64,cG5n');
        expect(html).toContain('GST-000001');
        expect(html).toContain('&lt;Unsafe Customer&gt;');
        expect(html).toContain('Duplicate');
        expect(html).toContain('Admin');
        expect(html).toContain('<table>');
        expect(html).toContain('100.00');
        expect(html).toContain('18.00');
    });
});
