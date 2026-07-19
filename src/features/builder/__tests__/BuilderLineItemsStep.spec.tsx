/** @format */

/**
 * Exercises the line-item step bridge and editor-only line-item configuration.
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BuilderLineItemsStep } from '../BuilderLineItemsStep';

describe('BuilderLineItemsStep', () => {
    it('renders the previous-step bridge and line-item field editor without preview clutter', () => {
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
        expect(screen.getByRole('button', { name: /Add field/u })).toBeVisible();
        expect(screen.getByText('Edit Item name')).toBeVisible();
        expect(screen.queryByRole('heading', { name: 'Sample rows' })).not.toBeInTheDocument();
        expect(screen.queryByText('Sample row 1')).not.toBeInTheDocument();
    });
});
