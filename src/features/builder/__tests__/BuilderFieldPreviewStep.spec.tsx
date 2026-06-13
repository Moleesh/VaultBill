/** @format */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { builtInDefaultFormat } from '../../../db/startup/BuiltInDefaultFormat';
import { BuilderFieldPreviewStep } from '../BuilderFieldPreviewStep';

describe('BuilderFieldPreviewStep', () => {
    it('uses the configured layout columns and gap in the field preview grid', () => {
        render(
            <BuilderFieldPreviewStep
                assets={[]}
                config={builtInDefaultFormat}
                fields={builtInDefaultFormat.Fields}
                layout={{ Columns: 3, Gap: 28 }}
                lineSection={undefined}
            />,
        );

        const grid = screen.getByLabelText('Document field preview');
        const layoutGrid = grid.querySelector('.builder-preview-grid');

        expect(layoutGrid).not.toBeNull();
        expect(layoutGrid).toHaveStyle({
            gap: '28px',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        });
        expect(screen.getByRole('heading', { name: 'Field preview' })).toBeVisible();
    });
});
