/** @format */

/**
 * Exercises the line-item step bridge and summary copy so subtotal and total
 * guidance stays visible where users configure repeatable rows.
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BuilderLineItemsStep } from '../BuilderLineItemsStep';

describe('BuilderLineItemsStep', () => {
    it('renders the previous-step bridge, row preview, and subtotal summary', () => {
        render(
            <BuilderLineItemsStep
                enabled
                lineSection={{
                    Label: 'Items',
                    MaxRows: 10,
                    Fields: [
                        {
                            FieldId: 'ItemName',
                            Label: 'Item name',
                            Type: 'Text',
                            SampleValue: 'Sample Item',
                        } as never,
                        {
                            FieldId: 'Amount',
                            Label: 'Amount',
                            Type: 'Money',
                            SampleValue: '1000.00',
                        } as never,
                    ],
                }}
                onAdd={vi.fn()}
                onEnabledChange={vi.fn()}
                onChange={vi.fn()}
                onEdit={vi.fn()}
                onLabelChange={vi.fn()}
                onMaxRowsChange={vi.fn()}
                onPrevious={vi.fn()}
                referencedFieldIds={new Set()}
            />,
        );

        expect(screen.getByRole('button', { name: /Previous: Fields/u })).toBeVisible();
        expect(screen.getAllByText('Subtotal')[0]).toBeVisible();
        expect(screen.getAllByText('Total')[0]).toBeVisible();
        expect(screen.getByRole('heading', { name: 'Sample rows' })).toBeVisible();
        expect(screen.getByText('Sample row 1')).toBeVisible();
    });
});
