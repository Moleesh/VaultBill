/** @format */

import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BuilderDocumentLibrary } from '../BuilderDocumentLibrary';

const requireButton = (button: HTMLElement | undefined): HTMLElement => {
    if (!button) throw new Error('Expected document action button to be rendered.');
    return button;
};

const createDataTransfer = () => {
    const values = new Map<string, string>();
    return {
        dropEffect: 'move',
        effectAllowed: 'move',
        getData: (format: string) => values.get(format) ?? '',
        setData: (format: string, value: string) => {
            values.set(format, value);
        },
    };
};

const fireDragEvent = (
    element: Element,
    type: 'dragOver' | 'drop',
    options: {
        readonly clientY: number;
        readonly dataTransfer: ReturnType<typeof createDataTransfer>;
    },
) => {
    const event = createEvent[type](element, {
        dataTransfer: options.dataTransfer,
    });
    Object.defineProperty(event, 'clientY', { value: options.clientY });
    fireEvent(element, event);
};

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
        expect(screen.getByText('Default')).toBeVisible();

        const firstEditButton = screen.getByRole('button', { name: 'Edit GST Invoice' });
        const firstDuplicateButton = screen.getByRole('button', {
            name: 'Duplicate GST Invoice',
        });

        expect(screen.getByRole('button', { name: 'Preview GST Invoice' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Preview Retail Invoice' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Test print Retail Invoice' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Delete Retail Invoice' })).toBeVisible();
        expect(screen.getByLabelText('GST Invoice is enabled')).toBeVisible();
        expect(screen.getByLabelText('Retail Invoice is enabled')).toBeVisible();

        fireEvent.click(firstEditButton);
        expect(onEditDocument).toHaveBeenCalledWith('TaxInvoice');

        fireEvent.click(screen.getByRole('button', { name: /New document/u }));
        fireEvent.click(firstDuplicateButton);
        fireEvent.click(screen.getByRole('button', { name: 'Test print Retail Invoice' }));
        fireEvent.click(screen.getByRole('button', { name: 'More actions for Retail Invoice' }));
        fireEvent.click(screen.getByRole('button', { name: 'Format preview' }));
        fireEvent.click(screen.getByRole('button', { name: 'Set default' }));
        const deleteButton = requireButton(
            screen.queryByRole('button', { name: 'Delete Retail Invoice' }) ?? undefined,
        );
        fireEvent.click(deleteButton);

        expect(onCreateNew).toHaveBeenCalledTimes(1);
        expect(onDuplicateDocument).toHaveBeenCalledWith('TaxInvoice');
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

        const dataTransfer = createDataTransfer();
        fireEvent.dragStart(screen.getByRole('button', { name: 'Reorder Retail Invoice' }), {
            dataTransfer,
        });
        const gstInvoiceRow = screen.getByText('GST Invoice').closest('article');
        if (!gstInvoiceRow) throw new Error('Expected GST Invoice row to be rendered.');
        fireEvent.drop(gstInvoiceRow, { clientY: 0, dataTransfer });
        expect(onReorderDocuments).toHaveBeenCalledWith('RetailInvoice', 'TaxInvoice', 'before');

        const afterDataTransfer = createDataTransfer();
        fireEvent.dragStart(screen.getByRole('button', { name: 'Reorder GST Invoice' }), {
            dataTransfer: afterDataTransfer,
        });
        const retailInvoiceRow = screen.getByText('Retail Invoice').closest('article');
        if (!retailInvoiceRow) throw new Error('Expected Retail Invoice row to be rendered.');
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
        fireDragEvent(retailInvoiceRow, 'dragOver', {
            clientY: 40,
            dataTransfer: afterDataTransfer,
        });
        fireDragEvent(retailInvoiceRow, 'drop', {
            clientY: 40,
            dataTransfer: afterDataTransfer,
        });
        expect(onReorderDocuments).toHaveBeenCalledWith('TaxInvoice', 'RetailInvoice', 'after');
    });

    it('blocks destructive actions for the only enabled custom document', () => {
        render(
            <BuilderDocumentLibrary
                currentFormatId="RetailInvoice"
                currentFormatName="Retail Invoice"
                inventory={[
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
    });
});
