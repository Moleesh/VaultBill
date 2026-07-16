/** @format */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BuilderLayoutStep } from '../BuilderLayoutStep';

describe('BuilderLayoutStep', () => {
    it('caps layout columns at five and uses flex copy', () => {
        render(<BuilderLayoutStep layout={{ Columns: 4, Gap: 24 }} onLayoutChange={vi.fn()} />);

        expect(screen.getByLabelText('Columns')).toBeVisible();
        expect(
            screen.getByText('Use columns and gap to shape a simple page flow for the form.'),
        ).toBeVisible();
        expect(screen.getByText('Invoice date')).toBeVisible();
        expect(screen.getByText('2026-06-04')).toBeVisible();
    });

    it('prefers configured document fields in the preview', () => {
        render(
            <BuilderLayoutStep
                fields={[
                    {
                        FieldId: 'CustomerName',
                        Label: 'Customer name',
                        Type: 'Text',
                        Required: true,
                        Visible: true,
                    },
                ]}
                layout={{ Columns: 2, Gap: 16 }}
                onLayoutChange={vi.fn()}
            />,
        );

        expect(screen.getByText('Customer name')).toBeVisible();
        expect(screen.getByText('Acme Traders')).toBeVisible();
    });
});
