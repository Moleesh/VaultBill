/** @format */

import { describe, expect, it } from 'vitest';

import { builtInDefaultFormat } from '../../../db/startup/BuiltInDefaultFormat';
import {
    createNewDocumentDraft,
    describeInventoryItem,
    duplicateDocumentDraft,
} from '../BuilderDocumentLibrarySupport';

describe('BuilderDocumentLibrarySupport', () => {
    it('creates unique drafts for new and duplicated documents', () => {
        const created = createNewDocumentDraft(['TaxInvoice']);
        const duplicated = duplicateDocumentDraft(builtInDefaultFormat, [
            'TaxInvoice',
            'GSTInvoiceCopy',
        ]);

        expect(created.FormatId).not.toBe('TaxInvoice');
        expect(created.FormatName).toBe('GST Invoice');
        expect(duplicated.FormatId).not.toBe('TaxInvoice');
        expect(duplicated.FormatName).toContain('Copy');
    });

    it('describes inventory rows with status and asset counts', () => {
        expect(
            describeInventoryItem({
                formatId: 'TaxInvoice',
                formatName: 'GST Invoice',
                isDefault: true,
                updatedAt: '2026-06-14T00:00:00.000Z',
                templateName: 'GST Invoice Print',
                assetCount: 2,
                isValid: true,
            }),
        ).toContain('Default document');
    });
});
