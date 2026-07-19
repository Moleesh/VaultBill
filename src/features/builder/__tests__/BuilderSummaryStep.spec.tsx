/** @format */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BuilderSummaryStep } from '../BuilderSummaryStep';

describe('BuilderSummaryStep', () => {
    it('adds and removes summary fields with explicit action buttons', () => {
        const onChange = vi.fn();
        const onAdd = vi.fn();
        const fields = [
            {
                FieldId: 'Subtotal',
                Label: 'Subtotal',
                Type: 'Money',
                DisplayPlacement: 'Summary',
                Visible: true,
            },
            {
                FieldId: 'DiscountAmount',
                Label: 'Discount Amount',
                Type: 'Money',
                DisplayPlacement: 'Form',
                Visible: true,
            },
        ] as const;

        render(
            <BuilderSummaryStep
                fields={fields as never}
                onAdd={onAdd}
                onChange={onChange}
                onEdit={vi.fn()}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

        expect(onChange).toHaveBeenLastCalledWith([
            expect.objectContaining({
                FieldId: 'Subtotal',
                DisplayPlacement: 'Form',
                Visible: true,
            }),
            expect.objectContaining({ FieldId: 'DiscountAmount' }),
        ]);

        fireEvent.click(screen.getByRole('button', { name: 'Add summary field' }));
        fireEvent.click(screen.getByRole('button', { name: 'Add' }));

        expect(onChange).toHaveBeenLastCalledWith([
            expect.objectContaining({ FieldId: 'Subtotal' }),
            expect.objectContaining({
                FieldId: 'DiscountAmount',
                DisplayPlacement: 'Summary',
                Visible: true,
            }),
        ]);
    });

    it('creates a new summary field when there are no available candidates', () => {
        const onAdd = vi.fn();
        const fields = [
            {
                FieldId: 'Subtotal',
                Label: 'Subtotal',
                Type: 'Money',
                DisplayPlacement: 'Summary',
                Visible: true,
            },
        ] as const;

        render(
            <BuilderSummaryStep
                fields={fields as never}
                onAdd={onAdd}
                onChange={vi.fn()}
                onEdit={vi.fn()}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Add summary field' }));

        expect(onAdd).toHaveBeenCalledOnce();
    });
});
