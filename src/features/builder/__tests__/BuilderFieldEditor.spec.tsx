/** @format */

/**
 * Covers the reorderable field list so reference warnings stay visible while
 * delete remains available for user-managed JSON cleanup.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BuilderFieldEditor } from '../BuilderFieldEditor';

describe('BuilderFieldEditor', () => {
    it('supports click-to-place reordering for keyboard and unreliable drag paths', () => {
        const onChange = vi.fn();

        render(
            <BuilderFieldEditor
                fields={
                    [
                        {
                            FieldId: 'InvoiceDate',
                            Label: 'Invoice Date',
                            Type: 'Date',
                        },
                        {
                            FieldId: 'CustomerName',
                            Label: 'Customer Name',
                            Type: 'Text',
                        },
                    ] as never
                }
                onAdd={vi.fn()}
                onChange={onChange}
                onEdit={vi.fn()}
                referencedFieldIds={new Set()}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: /Drag Customer Name/u }));
        fireEvent.click(screen.getByRole('button', { name: /Place before/u }));

        expect(onChange).toHaveBeenCalledWith([
            expect.objectContaining({ FieldId: 'CustomerName' }),
            expect.objectContaining({ FieldId: 'InvoiceDate' }),
        ]);
    });

    it('keeps delete enabled for referenced fields and shows a warning', () => {
        const onChange = vi.fn();
        const onEdit = vi.fn();

        render(
            <BuilderFieldEditor
                fields={
                    [
                        {
                            FieldId: 'Subtotal',
                            Label: 'Subtotal',
                            Type: 'Money',
                            Calculated: true,
                        },
                    ] as never
                }
                onAdd={vi.fn()}
                onChange={onChange}
                onEdit={onEdit}
                referencedFieldIds={new Set(['Subtotal'])}
            />,
        );

        expect(screen.getByText('Used in a formula')).toBeVisible();

        fireEvent.click(screen.getByRole('button', { name: /Delete Subtotal/u }));

        expect(onChange).toHaveBeenCalledWith([]);
    });
});
