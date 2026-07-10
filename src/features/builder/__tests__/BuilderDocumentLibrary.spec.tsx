/** @format */

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BuilderDocumentLibrary } from '../BuilderDocumentLibrary';

describe('BuilderDocumentLibrary', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="portal-root"></div>';
    });

    it('lists documents and exposes row-level create, edit, duplicate, and delete actions', () => {
        const onCreateNew = vi.fn();
        const onDeleteDocument = vi.fn();
        const onDuplicateDocument = vi.fn();
        const onEditDocument = vi.fn();
        const onOpenFormatPreview = vi.fn();
        const onOpenPrintPreview = vi.fn();
        const onReorderDocuments = vi.fn();
        const onSetDefaultDocument = vi.fn();
        const onSetDocumentEnabled = vi.fn();
        const onTestPrintDocument = vi.fn();

        render(
            <BuilderDocumentLibrary
                currentFormatId="TaxInvoice"
                currentFormatName="GST Invoice"
                inventory={[
                    {
                        formatId: 'TaxInvoice',
                        formatName: 'GST Invoice',
                        isDefault: true,
                        isBuiltIn: true,
                        isEnabled: true,
                        updatedAt: '2026-06-14T00:00:00.000Z',
                        templateName: 'GST Invoice Print',
                        assetCount: 1,
                        isValid: true,
                        sortOrder: 0,
                    },
                    {
                        formatId: 'RetailInvoice',
                        formatName: 'Retail Invoice',
                        isDefault: false,
                        isBuiltIn: false,
                        isEnabled: true,
                        updatedAt: '2026-06-15T00:00:00.000Z',
                        templateName: 'Retail Invoice Print',
                        assetCount: 2,
                        isValid: true,
                        sortOrder: 1,
                    },
                ]}
                onCreateNew={onCreateNew}
                onDeleteDocument={onDeleteDocument}
                onDuplicateDocument={onDuplicateDocument}
                onEditDocument={onEditDocument}
                onOpenFormatPreview={onOpenFormatPreview}
                onOpenPrintPreview={onOpenPrintPreview}
                onReorderDocuments={onReorderDocuments}
                onSetDefaultDocument={onSetDefaultDocument}
                onSetDocumentEnabled={onSetDocumentEnabled}
                onTestPrintDocument={onTestPrintDocument}
            />,
        );

        expect(screen.getByRole('heading', { name: 'Available documents' })).toBeVisible();
        expect(screen.getByRole('button', { name: /New document/u })).toBeVisible();
        expect(screen.getByText('Current')).toBeVisible();
        expect(screen.getByText('Default')).toBeVisible();

        const editButtons = screen.getAllByRole('button', { name: 'Edit' });
        const duplicateButtons = screen.getAllByRole('button', { name: 'Duplicate' });
        const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
        const firstEditButton = editButtons[0];
        const firstDuplicateButton = duplicateButtons[0];
        const secondDeleteButton = deleteButtons[1];

        expect(firstEditButton).toBeDefined();
        expect(firstDuplicateButton).toBeDefined();
        expect(secondDeleteButton).toBeDefined();
        if (!firstEditButton || !firstDuplicateButton || !secondDeleteButton) {
            throw new Error('Expected document action buttons to be rendered.');
        }

        fireEvent.click(firstEditButton);
        expect(onEditDocument).toHaveBeenCalledWith('TaxInvoice');

        fireEvent.click(screen.getByRole('button', { name: /New document/u }));
        fireEvent.click(firstDuplicateButton);
        fireEvent.click(secondDeleteButton);

        expect(onCreateNew).toHaveBeenCalledTimes(1);
        expect(onDuplicateDocument).toHaveBeenCalledWith('TaxInvoice');
        expect(screen.getByRole('heading', { name: 'Delete document?' })).toBeVisible();
        fireEvent.click(screen.getByRole('button', { name: 'Delete document' }));

        expect(onDeleteDocument).toHaveBeenCalledWith(
            expect.objectContaining({ formatId: 'RetailInvoice', isEnabled: true }),
        );
    });
});
