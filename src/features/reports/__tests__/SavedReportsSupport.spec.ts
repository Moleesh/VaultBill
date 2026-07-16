/** @format */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ReportFieldFilter } from '../ReportsPageTypes';
import {
    builtInSavedReports,
    canManageSavedReport,
    createSavedReportDraft,
    deleteCustomSavedReport,
    duplicateSavedReport,
    fieldKindForReportField,
    normalizeReportFilters,
    operatorOptionsForReportField,
    readDefaultSavedReportId,
    readSavedReports,
    reportSummaryLabel,
    saveCustomSavedReport,
    saveDefaultSavedReportId,
} from '../SavedReportsSupport';

describe('SavedReportsSupport', () => {
    beforeEach(() => {
        window.localStorage.clear();
        vi.restoreAllMocks();
    });

    it('normalizes saved-report filters and preserves prompt/case flags', () => {
        const filters: readonly ReportFieldFilter[] = [
            {
                id: '1',
                field: 'customerName',
                value: 'Aster',
                caseInsensitive: false,
                promptAtRun: true,
            },
            {
                id: '2',
                field: 'invoiceDate',
                operator: 'between',
                value: '2026-07-01',
                valueEnd: '2026-07-03',
            },
        ];

        expect(normalizeReportFilters(filters)).toEqual([
            {
                id: '1',
                field: 'customerName',
                operator: 'contains',
                value: 'Aster',
                caseInsensitive: false,
                promptAtRun: true,
            },
            {
                id: '2',
                field: 'invoiceDate',
                operator: 'between',
                value: '2026-07-01',
                valueEnd: '2026-07-03',
            },
        ]);
    });

    it('creates, reads, duplicates, and deletes custom saved reports', () => {
        vi.spyOn(crypto, 'randomUUID')
            .mockReturnValueOnce('11111111-1111-1111-1111-111111111111')
            .mockReturnValueOnce('22222222-2222-2222-2222-222222222222');

        const saved = saveCustomSavedReport(
            createSavedReportDraft({
                ownerUserId: 'admin_1',
                name: 'Outstanding invoices',
                formatId: 'TaxInvoice',
                displayFields: ['customerName', 'grandTotal'],
                filters: [
                    {
                        id: 'filter-1',
                        field: 'status',
                        operator: 'is',
                        value: 'Draft',
                    },
                ],
                preset: 'AllTime',
                sorts: ['grandTotal:asc'],
                status: 'Draft',
            }),
        );

        expect(readSavedReports()).toContainEqual(saved);
        expect(saved.displayFields).toEqual(['customerName', 'grandTotal']);
        expect(saved.sorts).toEqual(['grandTotal:asc']);
        expect(canManageSavedReport(saved, 'admin_1', false)).toBe(true);
        expect(canManageSavedReport(saved, 'other', false)).toBe(false);
        expect(canManageSavedReport(saved, 'other', true)).toBe(true);

        const duplicate = duplicateSavedReport({
            ownerUserId: 'admin_2',
            report: saved,
        });

        expect(duplicate.name).toBe('Outstanding invoices copy');
        expect(duplicate.ownerUserId).toBe('admin_2');
        expect(duplicate.displayFields).toEqual(saved.displayFields);
        expect(duplicate.sorts).toEqual(saved.sorts);
        expect(readSavedReports()).toContainEqual(duplicate);

        deleteCustomSavedReport(saved.reportId, 'admin_1', false);
        expect(readSavedReports()).not.toContainEqual(saved);
    });

    it('stores personal defaults and describes report metadata', () => {
        const report = builtInSavedReports[0];
        if (!report) throw new Error('Expected a built-in saved report.');

        saveDefaultSavedReportId('admin_1', report.reportId);

        expect(readDefaultSavedReportId('admin_1')).toBe(report.reportId);
        expect(fieldKindForReportField('invoiceDate')).toBe('date');
        expect(operatorOptionsForReportField('status').map((option) => option.value)).toEqual([
            'is',
            'is-not',
            'one-of',
        ]);
        expect(reportSummaryLabel(report)).toContain('GST Invoice');
    });
});
