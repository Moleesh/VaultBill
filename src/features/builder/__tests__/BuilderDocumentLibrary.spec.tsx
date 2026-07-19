/** @format */

import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BuilderDocumentLibrary } from '../BuilderDocumentLibrary';
import type { BuilderInventoryItem } from '../BuilderDocumentLibrarySupport';

const requireButton = (button: HTMLElement | undefined): HTMLElement => {
    if (!button) throw new Error('Expected document action button to be rendered.');
    return button;
};

const firePointerEvent = (
    element: Element,
    type: 'pointerDown' | 'pointerMove' | 'pointerUp',
    options: {
        readonly button?: number;
        readonly clientX: number;
        readonly clientY: number;
        readonly pointerId: number;
    },
) => {
    const event = createEvent[type](element);
    Object.defineProperty(event, 'button', { value: options.button ?? 0 });
    Object.defineProperty(event, 'clientX', { value: options.clientX });
    Object.defineProperty(event, 'clientY', { value: options.clientY });
    Object.defineProperty(event, 'pointerId', { value: options.pointerId });
    fireEvent(element, event);
};

const makeInventoryItem = (
    item: Pick<BuilderInventoryItem, 'formatId' | 'formatName'> & Partial<BuilderInventoryItem>,
): BuilderInventoryItem => ({
    isDefault: false,
    isBuiltIn: false,
    isEnabled: true,
    updatedAt: '2026-06-15T00:00:00.000Z',
    templateName: `${item.formatName} Print`,
    assetCount: 1,
    isValid: true,
    sortOrder: 0,
    ...item,
});

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
                    makeInventoryItem({
                        formatId: 'TaxInvoice',
                        formatName: 'GST Invoice',
                        isDefault: true,
                        isBuiltIn: true,
                        updatedAt: '2026-06-14T00:00:00.000Z',
                    }),
                    makeInventoryItem({
                        formatId: 'RetailInvoice',
                        formatName: 'Retail Invoice',
                        assetCount: 2,
                        sortOrder: 1,
                    }),
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
        expect(screen.getByText('Default')).toBeVisible();

        const firstEditButton = screen.getByRole('button', { name: 'Edit GST Invoice' });

        expect(screen.getByRole('button', { name: 'Delete Retail Invoice' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Set Retail Invoice as default' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Disable Retail Invoice' })).toBeVisible();
        expect(screen.getByLabelText('GST Invoice is enabled')).toBeVisible();
        expect(screen.getByLabelText('Retail Invoice is enabled')).toBeVisible();

        fireEvent.click(firstEditButton);
        expect(onEditDocument).toHaveBeenCalledWith('TaxInvoice');

        fireEvent.click(screen.getByRole('button', { name: /New document/u }));
        fireEvent.click(screen.getByRole('button', { name: 'More actions for Retail Invoice' }));
        fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }));
        fireEvent.click(screen.getByRole('button', { name: 'Field preview' }));
        fireEvent.click(screen.getByRole('button', { name: 'More actions for Retail Invoice' }));
        fireEvent.click(screen.getByRole('button', { name: 'Print preview' }));
        fireEvent.click(screen.getByRole('button', { name: 'More actions for Retail Invoice' }));
        fireEvent.click(screen.getByRole('button', { name: 'Test print' }));
        fireEvent.click(screen.getByRole('button', { name: 'Set Retail Invoice as default' }));
        const deleteButton = requireButton(
            screen.queryByRole('button', { name: 'Delete Retail Invoice' }) ?? undefined,
        );
        fireEvent.click(deleteButton);

        expect(onCreateNew).toHaveBeenCalledTimes(1);
        expect(onDuplicateDocument).toHaveBeenCalledWith('RetailInvoice');
        expect(onOpenPrintPreview).toHaveBeenCalledWith('RetailInvoice');
        expect(onOpenFormatPreview).toHaveBeenCalledWith('RetailInvoice');
        expect(onSetDefaultDocument).toHaveBeenCalledWith(
            expect.objectContaining({ formatId: 'RetailInvoice' }),
        );
        expect(onTestPrintDocument).toHaveBeenCalledWith('RetailInvoice');
        expect(screen.getByRole('heading', { name: 'Delete document?' })).toBeVisible();
        fireEvent.click(screen.getByRole('button', { name: 'Delete document' }));

        expect(onDeleteDocument).toHaveBeenCalledWith(
            expect.objectContaining({ formatId: 'RetailInvoice', isEnabled: true }),
        );

        const gstInvoiceRow = screen.getByText('GST Invoice').closest('article');
        if (!gstInvoiceRow) throw new Error('Expected GST Invoice row to be rendered.');
        const retailInvoiceRow = screen.getByText('Retail Invoice').closest('article');
        if (!retailInvoiceRow) throw new Error('Expected Retail Invoice row to be rendered.');

        fireEvent.click(screen.getByRole('button', { name: 'Reorder Retail Invoice' }));
        fireEvent.click(gstInvoiceRow);
        expect(onReorderDocuments).toHaveBeenCalledWith('RetailInvoice', 'TaxInvoice', 'before');

        vi.spyOn(gstInvoiceRow, 'getBoundingClientRect').mockReturnValue({
            bottom: 50,
            height: 50,
            left: 0,
            right: 100,
            top: 0,
            width: 100,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        });
        const elementFromPointSpy = vi.fn(() => gstInvoiceRow);
        Object.defineProperty(document, 'elementFromPoint', {
            configurable: true,
            value: elementFromPointSpy,
        });
        const retailHandle = screen.getByRole('button', { name: 'Reorder Retail Invoice' });
        firePointerEvent(retailHandle, 'pointerDown', {
            button: 0,
            clientX: 0,
            clientY: 0,
            pointerId: 1,
        });
        firePointerEvent(retailHandle, 'pointerMove', {
            clientX: 0,
            clientY: 8,
            pointerId: 1,
        });
        firePointerEvent(retailHandle, 'pointerUp', {
            clientX: 0,
            clientY: 8,
            pointerId: 1,
        });
        expect(onReorderDocuments).toHaveBeenCalledWith('RetailInvoice', 'TaxInvoice', 'before');

        vi.spyOn(retailInvoiceRow, 'getBoundingClientRect').mockReturnValue({
            bottom: 50,
            height: 50,
            left: 0,
            right: 100,
            top: 0,
            width: 100,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        });
        elementFromPointSpy.mockReturnValue(retailInvoiceRow);
        const gstHandle = screen.getByRole('button', { name: 'Reorder GST Invoice' });
        firePointerEvent(gstHandle, 'pointerDown', {
            button: 0,
            clientX: 0,
            clientY: 0,
            pointerId: 2,
        });
        firePointerEvent(gstHandle, 'pointerMove', {
            clientX: 0,
            clientY: 40,
            pointerId: 2,
        });
        firePointerEvent(gstHandle, 'pointerUp', {
            clientX: 0,
            clientY: 40,
            pointerId: 2,
        });
        expect(onReorderDocuments).toHaveBeenCalledWith('TaxInvoice', 'RetailInvoice', 'after');
    });

    it('blocks deleting the only enabled custom document while allowing disable', () => {
        render(
            <BuilderDocumentLibrary
                currentFormatId="RetailInvoice"
                currentFormatName="Retail Invoice"
                inventory={[
                    makeInventoryItem({
                        formatId: 'RetailInvoice',
                        formatName: 'Retail Invoice',
                        assetCount: 2,
                        sortOrder: 1,
                    }),
                ]}
                onCreateNew={vi.fn()}
                onDeleteDocument={vi.fn()}
                onDuplicateDocument={vi.fn()}
                onEditDocument={vi.fn()}
                onOpenFormatPreview={vi.fn()}
                onOpenPrintPreview={vi.fn()}
                onReorderDocuments={vi.fn()}
                onSetDefaultDocument={vi.fn()}
                onSetDocumentEnabled={vi.fn()}
                onTestPrintDocument={vi.fn()}
            />,
        );

        expect(screen.getByRole('button', { name: 'Delete Retail Invoice' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Delete Retail Invoice' })).toHaveAttribute(
            'title',
            'Keep at least one document enabled.',
        );
        expect(screen.getByRole('button', { name: 'Disable Retail Invoice' })).not.toBeDisabled();
    });
});
