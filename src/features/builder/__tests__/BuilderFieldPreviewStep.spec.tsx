/** @format */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { builtInDefaultFormat } from '../../../db/startup/BuiltInDefaultFormat';
import { BuilderFieldPreviewStep } from '../BuilderFieldPreviewStep';

describe('BuilderFieldPreviewStep', () => {
    it('uses the configured layout columns and gap in the field preview grid', () => {
        render(
            <BuilderFieldPreviewStep
                config={builtInDefaultFormat}
                fields={builtInDefaultFormat.Fields}
                layout={{ Columns: 3, Gap: 28 }}
                lineSection={undefined}
            />,
        );

        const grid = screen.getByLabelText('Document field preview');
        const layoutGrid = grid.querySelector('.builder-preview-grid--read-only');

        expect(layoutGrid).not.toBeNull();
        expect(layoutGrid).toHaveStyle({ gap: '28px' });
        expect(screen.getByRole('heading', { name: 'Field preview' })).toBeVisible();
        expect(screen.queryByText('Document fields')).toBeNull();
        expect(
            screen.getByText(/Flex columns 3 with 28px gap\. This view is read-only/u),
        ).toBeVisible();
    });
});
