/** @format */

/**
 * Exercises the line-item step bridge and summary copy so subtotal and total
 * guidance stays visible where users configure repeatable rows.
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BuilderLineItemsStep } from '../BuilderLineItemsStep';

describe('BuilderLineItemsStep', () => {
    it('renders the previous-step bridge and subtotal summary', () => {
        render(
            <BuilderLineItemsStep
                lineSection={{ Label: 'Items', MaxRows: 10, Fields: [] }}
                onAdd={vi.fn()}
                onChange={vi.fn()}
                onEdit={vi.fn()}
                onLabelChange={vi.fn()}
                onMaxRowsChange={vi.fn()}
                onPrevious={vi.fn()}
                referencedFieldIds={new Set()}
            />,
        );

        expect(screen.getByRole('button', { name: /Previous: Fields/u })).toBeVisible();
        expect(screen.getByText('Subtotal')).toBeVisible();
        expect(screen.getByText('Total')).toBeVisible();
    });
});
