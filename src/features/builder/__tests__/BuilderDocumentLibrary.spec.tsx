/** @format */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BuilderDocumentLibrary } from '../BuilderDocumentLibrary';

describe('BuilderDocumentLibrary', () => {
    it('lists documents and exposes create, duplicate, and load actions', () => {
        const onCreateNew = vi.fn();
        const onDuplicateCurrent = vi.fn();
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
                ]}
                onCreateNew={onCreateNew}
                onDuplicateCurrent={onDuplicateCurrent}
                onLoadDocument={onLoadDocument}
            />,
        );

        expect(screen.getByRole('heading', { name: 'Document library' })).toBeVisible();
        expect(screen.getByRole('button', { name: /New from default/u })).toBeVisible();
        expect(screen.getByRole('button', { name: /Duplicate current/u })).toBeVisible();
        expect(screen.getByRole('button', { name: /Edit current/u })).toBeVisible();

        fireEvent.click(screen.getByRole('button', { name: /GST Invoice/u }));
        expect(onLoadDocument).toHaveBeenCalledWith('TaxInvoice');

        fireEvent.click(screen.getByRole('button', { name: /New from default/u }));
        fireEvent.click(screen.getByRole('button', { name: /Duplicate current/u }));

        expect(onCreateNew).toHaveBeenCalledTimes(1);
        expect(onDuplicateCurrent).toHaveBeenCalledTimes(1);
    });
});
