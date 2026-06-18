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
    });
});
