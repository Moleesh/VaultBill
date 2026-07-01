/** @format */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BuilderDocumentLibrary } from '../BuilderDocumentLibrary';

describe('BuilderDocumentLibrary', () => {
    it('lists documents and exposes row-level create, edit, duplicate, and delete actions', () => {
        const onCreateNew = vi.fn();
        const onDeleteDocument = vi.fn();
        const onDuplicateDocument = vi.fn();
        const onLoadDocument = vi.fn();

        render(
            <BuilderDocumentLibrary
                currentFormatId="TaxInvoice"
                currentFormatName="GST Invoice"
                inventory={[
                    {
                        formatId: 'TaxInvoice',
                        formatName: 'GST Invoice',
                        isDefault: true,
                        updatedAt: '2026-06-14T00:00:00.000Z',
                        templateName: 'GST Invoice Print',
                        assetCount: 1,
                        isValid: true,
                    },
                    {
                        formatId: 'RetailInvoice',
                        formatName: 'Retail Invoice',
                        isDefault: false,
                        updatedAt: '2026-06-15T00:00:00.000Z',
                        templateName: 'Retail Invoice Print',
                        assetCount: 2,
                        isValid: true,
                    },
                ]}
                onCreateNew={onCreateNew}
                onDeleteDocument={onDeleteDocument}
                onDuplicateDocument={onDuplicateDocument}
                onLoadDocument={onLoadDocument}
            />,
        );

        expect(screen.getByRole('heading', { name: 'Document library' })).toBeVisible();
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
        expect(onLoadDocument).toHaveBeenCalledWith('TaxInvoice');

        fireEvent.click(screen.getByRole('button', { name: /New document/u }));
        fireEvent.click(firstDuplicateButton);
        fireEvent.click(secondDeleteButton);

        expect(onCreateNew).toHaveBeenCalledTimes(1);
        expect(onDuplicateDocument).toHaveBeenCalledWith('TaxInvoice');
        expect(onDeleteDocument).toHaveBeenCalledWith(
            expect.objectContaining({ formatId: 'RetailInvoice' }),
        );
    });
});
