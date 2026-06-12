/** @format */

import { describe, expect, it, vi } from 'vitest';

vi.mock('../records/RecordPrintHtml', () => ({
    loadRecordPrintPackage: vi.fn(),
}));
vi.mock('../../runtime/HostedApi', () => ({
    requestHostedApi: vi.fn(),
}));

import { loadRecordPrintPackage } from '../records/RecordPrintHtml';
import type { AppRecord } from '../records/RecordStoreSupport';
import { requestHostedApi } from '../../runtime/HostedApi';
import {
    loadPrintPackages,
    pageSize,
    printBatchSize,
    requestReportPage,
    reportOptions,
} from './ReportsPageSupport';

const record = {
    recordId: 'record-1',
    formatId: 'TaxInvoice',
    formatName: 'GST Invoice',
    documentNumber: 'INV-1',
    status: 'Finalized',
    invoiceDate: '2026-06-01',
    customerName: 'Acme',
    gstin: 'GST-1',
    state: 'TN',
    billingAddress: 'Address',
    lineItems: [
        {
            rowId: 'row-1',
            itemName: 'Item',
            hsnSac: '',
            quantity: '1',
            rate: '100',
            taxPercent: '18',
            amount: '118.00',
        },
    ],
    grandTotal: '118.00',
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    createdBy: 'admin_1',
    createdByName: 'Admin',
} as AppRecord;

describe('ReportsPageSupport', () => {
    it('keeps the report presets and batching rules visible', () => {
        expect(pageSize).toBe(50);
        expect(printBatchSize).toBe(10);
        expect(reportOptions.map((option) => option.label)).toEqual([
            'Sales register',
            'Tax summary',
            'Customer ledger',
        ]);
    });

    it('loads print packages for the matching document formats only', async () => {
        vi.mocked(loadRecordPrintPackage).mockResolvedValueOnce({
            config: { Fields: [], LineItemSections: [], CalculationPolicy: {} } as never,
            templateHtml: '<html></html>',
            assets: [],
        });
        vi.mocked(loadRecordPrintPackage).mockResolvedValueOnce(undefined);

        const packages = await loadPrintPackages(
            [record, { ...record, recordId: 'record-2', formatId: 'Unknown' }],
            true,
        );

        expect(packages.size).toBe(1);
        expect(packages.get('TaxInvoice')).toMatchObject({ templateHtml: '<html></html>' });
    });

    it('requests the next report page from the hosted API when desktop is unavailable', async () => {
        delete (window as Partial<Window> & { vaultBillDesktop?: unknown }).vaultBillDesktop;
        vi.mocked(requestHostedApi).mockResolvedValueOnce({
            rows: [record],
            total: 1,
            nextCursor: 'cursor-2',
        });

        await expect(requestReportPage({ status: 'Finalized' })).resolves.toMatchObject({
            total: 1,
            nextCursor: 'cursor-2',
            rows: [expect.objectContaining({ recordId: 'record-1' })],
        });
    });
});
