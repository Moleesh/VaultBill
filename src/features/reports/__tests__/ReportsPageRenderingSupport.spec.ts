/** @format */

import { describe, expect, it } from 'vitest';

import {
    buildCustomerLedger,
    buildReportCsv,
    buildTaxSummary,
    renderReportHtml,
} from '../ReportsPageRenderingSupport';

const records = [
    {
        recordId: 'record-1',
        invoiceDate: '2026-06-01',
        customerName: 'Acme',
        gstin: 'GST-1',
        status: 'Finalized',
        documentNumber: 'INV-1',
        grandTotal: '118.00',
        lineItems: [{ taxPercent: '18', amount: '118.00' }],
    },
    {
        recordId: 'record-2',
        invoiceDate: '2026-06-02',
        customerName: 'Acme',
        gstin: 'GST-1',
        status: 'Cancelled',
        documentNumber: 'INV-2',
        grandTotal: '100.00',
        lineItems: [{ taxPercent: '18', amount: '100.00' }],
    },
] as const;

describe('ReportsPageRenderingSupport', () => {
    it('aggregates finalized tax and customer summaries', () => {
        expect(buildTaxSummary(records as never)).toEqual([
            expect.objectContaining({ rate: '18', count: 1 }),
        ]);
        expect(buildCustomerLedger(records as never)).toEqual([
            expect.objectContaining({
                customer: 'Acme',
                documents: 2,
                cancelled: 1,
                revenue: 118,
            }),
        ]);
    });

    it('renders CSV and HTML output for each report shape', () => {
        expect(
            buildReportCsv('sales-register', records as never, ['documentNumber', 'status']),
        ).toContain('"INV-1"');
        expect(
            buildReportCsv('customer-ledger', records as never, ['customerName', 'cancelledCount']),
        ).toContain('"1"');
        expect(
            renderReportHtml('tax-summary', records as never, ['taxRate', 'taxAmount']),
        ).toContain('matching records');
    });

    it('limits rendered sales-register output to the selected fields', () => {
        const csv = buildReportCsv('sales-register', records as never, [
            'customerName',
            'grandTotal',
        ]);

        expect(csv).toContain('"Customer name","Grand total"');
        expect(csv).not.toContain('"Record number"');
    });
});
