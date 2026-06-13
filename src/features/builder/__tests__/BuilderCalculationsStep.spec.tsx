/** @format */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { cloneDefault } from '../BuilderPageSupport';
import { BuilderCalculationsStep } from '../BuilderCalculationsStep';

describe('BuilderCalculationsStep', () => {
    it('supports drag ordering and formula editing', () => {
        const onOrderChange = vi.fn();
        const onEditFormula = vi.fn();
        const config = cloneDefault();

        render(
            <BuilderCalculationsStep
                allFields={
                    [
                        { FieldId: 'Subtotal', Label: 'Subtotal', Type: 'Money', Calculated: true },
                        { FieldId: 'Amount', Label: 'Amount', Type: 'Money', Calculated: true },
                    ] as never
                }
                calculationTargets={[
                    {
                        kind: 'document',
                        sectionIndex: 0,
                        fieldIndex: 0,
                        field: {
                            FieldId: 'Subtotal',
                            Label: 'Subtotal',
                            Type: 'Money',
                            Calculated: true,
                            Formula: 'SUMALL(Amount)',
                        } as never,
                    },
                    {
                        kind: 'line',
                        sectionIndex: 0,
                        fieldIndex: 0,
                        field: {
                            FieldId: 'Amount',
                            Label: 'Amount',
                            Type: 'Money',
                            Calculated: true,
                            Formula: 'Quantity * Rate',
                        } as never,
                    },
                ]}
                currencyPolicy={config.CalculationPolicy}
                onEditFormula={onEditFormula}
                onOrderChange={onOrderChange}
            />,
        );

        const dragHandle = screen.getByRole('button', { name: 'Drag Amount' });
        const targetRow = screen.getByRole('button', { name: /Edit Subtotal/ }).closest('article');
        if (!targetRow) throw new Error('Expected calculation row.');

        fireEvent.dragStart(dragHandle, {
            dataTransfer: {
                effectAllowed: 'move',
                setData: vi.fn(),
            },
        });
        fireEvent.drop(targetRow);

        expect(onOrderChange).toHaveBeenCalledWith(['Amount', 'Subtotal']);
        expect(screen.getByText('#1 trigger')).toBeVisible();

        fireEvent.click(within(targetRow).getByRole('button', { name: 'Edit Subtotal' }));
        expect(onEditFormula).toHaveBeenCalledWith('Subtotal');
    });
});
